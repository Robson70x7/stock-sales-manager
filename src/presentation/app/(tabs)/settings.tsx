import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { AuthService } from '@shared/lib/auth-service';
import { SyncManager, LocalP2PSyncAdapter, DeviceDiscoveryService } from '@shared/sync';
import { SyncButton } from '@/components/sync/SyncButton';
import { SyncModal } from '@/components/sync/SyncModal';
import { SyncDevice } from '@shared/sync/types';
import { DeviceInfo } from 'react-native-device-info';
import { queryClient } from '@shared/lib/query-client';
import { SqlConsole } from '@/components/dev/SqlConsole';

const SYNC_USERNAME_KEY = 'sync_username';
const SYNC_PASSWORD_KEY = 'sync_password';

export default function SettingsScreen() {
  const { data: settings } = useSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const colors = useColors();
  const router = useRouter();

  const [syncManager] = useState(() => new SyncManager());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'connected' | 'error' | 'reconnecting'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  const [deviceCount, setDeviceCount] = useState(0);
  const [desktopConnected, setDesktopConnected] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [sqlConsoleVisible, setSqlConsoleVisible] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [defaultAuthUsername, setDefaultAuthUsername] = useState('');

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discoveryRef = useRef<DeviceDiscoveryService | null>(null);
  const desktopIpRef = useRef<string | null>(null);

  useEffect(() => {
    const discovery = new DeviceDiscoveryService();
    discoveryRef.current = discovery;

    syncManager.onStateChange((s) => {
      setSyncStatus(s.status);
      setErrorMsg(s.error);
      if (s.desktopDeviceId) {
        setDesktopConnected(true);
      } else if (s.status === 'idle' || s.status === 'error') {
        setDesktopConnected(false);
      }
    });

    discovery.onDevicesChange((d) => {
      setDevices(d.map(dev => ({
        id: dev.id,
        name: dev.name,
        type: dev.type,
        ip: dev.ip,
        lastSeen: dev.lastSeen,
      })));
      setDeviceCount(d.length);
    });

    return () => {
      syncManager.disconnect();
      discovery.stop();
    };
  }, [syncManager]);

  const handleOpenSync = useCallback(async () => {
    const session = await AuthService.getSession();
    setDefaultAuthUsername(session?.username || '');
    setSyncModalVisible(true);
  }, []);

  const handleScanDevices = useCallback(async () => {
    const discovery = discoveryRef.current;
    if (discovery) {
      try {
        await discovery.runOnce();
      } catch {
      }
    }
  }, []);

  const handleCloseSync = useCallback(() => {
    setSyncModalVisible(false);
    setNeedsAuth(false);
  }, []);

  const tryAutoAuth = useCallback(async (): Promise<boolean> => {
    try {
      const savedUsername = await SecureStore.getItemAsync(SYNC_USERNAME_KEY);
      const savedPassword = await SecureStore.getItemAsync(SYNC_PASSWORD_KEY);
      if (savedUsername && savedPassword) {
        await syncManager.authenticate(savedUsername, savedPassword);
        return true;
      }
    } catch {
    }
    return false;
  }, [syncManager]);

  const handleConnect = useCallback(async (deviceId: string) => {
    const discovery = discoveryRef.current;
    if (!discovery) return;

    const selectedDevice = devices.find(d => d.id === deviceId);
    if (!selectedDevice?.ip) {
      throw new Error('Dispositivo não selecionado ou IP não disponível');
    }

    const deviceName = await DeviceInfo.getDeviceName();

    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        desktopIpRef.current = selectedDevice.ip;
        const adapter = new LocalP2PSyncAdapter(deviceName, discovery);
        adapter.setDesktopIp(selectedDevice.ip);
        await syncManager.initialize(adapter);
        await syncManager.connect();

        const authed = await tryAutoAuth();
        if (authed) {
          setSyncStatus('connected');
          setDesktopConnected(true);
        }
        setNeedsAuth(!authed);

        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await syncManager.disconnect();
        }
      }
    }

    if (lastError) throw lastError;
  }, [syncManager, devices, tryAutoAuth]);

  const handleAuthenticate = useCallback(async (username: string, password: string) => {
    const result = await syncManager.authenticate(username, password);
    await AuthService.createSessionFromUser(result.user, result.token);
    await SecureStore.setItemAsync(SYNC_USERNAME_KEY, username);
    await SecureStore.setItemAsync(SYNC_PASSWORD_KEY, password);
    setSyncStatus('connected');
    setDesktopConnected(true);
    setNeedsAuth(false);
  }, [syncManager]);

  const handleDisconnect = useCallback(async () => {
    await syncManager.disconnect();
    setSyncStatus('idle');
    setDesktopConnected(false);
    setNeedsAuth(false);
  }, [syncManager]);

  const handleSync = useCallback(async () => {
    if (syncStatus !== 'connected') return;

    let lastError: Error | null = null;
    const maxRetries = 3;
    let result: Awaited<ReturnType<typeof syncManager.syncAll>> | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await syncManager.syncAll();
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await syncManager.disconnect();
          const deviceName = await DeviceInfo.getDeviceName();
          const discovery = discoveryRef.current;
          const ip = desktopIpRef.current;
          if (discovery && ip) {
            const adapter = new LocalP2PSyncAdapter(deviceName, discovery);
            adapter.setDesktopIp(ip);
            await syncManager.initialize(adapter);
            await syncManager.connect();
            await tryAutoAuth();
          }
        }
      }
    }

    if (lastError) throw lastError;

    await queryClient.invalidateQueries();
    return result;
  }, [syncManager, syncStatus]);

  const handleHeaderTap = useCallback(() => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setSqlConsoleVisible(true);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  }, []);

  const handleToggleAskReturnStock = async (value: boolean) => {
    await updateSettings({ askReturnStockOnDelete: value });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            await SecureStore.deleteItemAsync(SYNC_USERNAME_KEY);
            await SecureStore.deleteItemAsync(SYNC_PASSWORD_KEY);
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <Pressable
        onPress={handleHeaderTap}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Configurações</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sincronização</Text>

          <View style={[styles.syncCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.syncRow}>
              <View style={styles.syncInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Desktop VendaFácil</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Sincronize dados com o Desktop na rede local
                </Text>
              </View>
              <SyncButton
                onPress={handleOpenSync}
                status={syncStatus}
                deviceCount={deviceCount}
                desktopConnected={desktopConnected}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exclusão de Vendas</Text>

          <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="delete" size={24} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Perguntar ao Excluir</Text>
                <Text style={[styles.settingDescription, { color: colors.muted }]}>
                  Perguntar se deseja devolver itens ao estoque
                </Text>
              </View>
            </View>
            <Switch
              value={settings?.askReturnStockOnDelete ?? true}
              onValueChange={handleToggleAskReturnStock}
              trackColor={{ false: colors.border, true: colors.primary + '50' }}
              thumbColor={settings?.askReturnStockOnDelete ? colors.primary : colors.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre</Text>

          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Versão</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{ DeviceInfo.getVersion() }</Text>
            </View>
          </View>

          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>Aplicativo</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{DeviceInfo.getApplicationName()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <MaterialIcons name="logout" size={24} color="#EF4444" />
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SyncModal
        visible={syncModalVisible}
        onClose={handleCloseSync}
        onConnect={handleConnect}
        onSync={handleSync}
        onScan={handleScanDevices}
        onAuthenticate={handleAuthenticate}
        onDisconnect={handleDisconnect}
        devices={devices}
        connected={syncStatus === 'connected'}
        needsAuth={needsAuth}
        syncStatus={syncStatus === 'reconnecting' ? 'idle' : syncStatus}
        error={errorMsg}
        defaultUsername={defaultAuthUsername}
      />

      <SqlConsole
        visible={sqlConsoleVisible}
        onClose={() => setSqlConsoleVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
    paddingBottom: 40,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncCard: {
    borderRadius: 12,
    borderWidth: 0.5,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  syncInfo: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  infoItem: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
