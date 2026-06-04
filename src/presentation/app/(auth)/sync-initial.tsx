import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { SyncManager, LocalP2PSyncAdapter, DeviceDiscoveryService } from '@shared/sync';
import { DeviceInfo } from 'react-native-device-info';

type SyncStep = 'idle' | 'discovering' | 'connecting' | 'syncing' | 'success' | 'error';

export default function SyncInitialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const [step, setStep] = useState<SyncStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [syncDetails, setSyncDetails] = useState<string>('');

  const syncManagerRef = useRef<SyncManager | null>(null);
  const discoveryRef = useRef<DeviceDiscoveryService | null>(null);

  useEffect(() => {
    return () => {
      syncManagerRef.current?.disconnect();
      discoveryRef.current?.stop();
    };
  }, []);

  const handleSync = useCallback(async () => {
    setStep('discovering');
    setErrorMsg('');
    setSyncDetails('');

    try {
      const discovery = new DeviceDiscoveryService();
      discoveryRef.current = discovery;

      discovery.onDevicesChange((devices) => {
        setSyncDetails(`Dispositivos encontrados: ${devices.length}`);
      });

      await discovery.runOnce();
      const devices = discovery.getDevices();
      const desktop = devices.find(d => d.type === 'desktop');

      if (!desktop?.ip) {
        setStep('error');
        setErrorMsg('Nenhum desktop encontrado na rede. Verifique se o VendaFácil Desktop está ligado na mesma rede.');
        return;
      }

      setStep('connecting');
      setSyncDetails(`Conectando a ${desktop.name} (${desktop.ip})...`);

      const deviceName = await DeviceInfo.getDeviceName();
      const adapter = new LocalP2PSyncAdapter(deviceName, discovery);
      adapter.setDesktopIp(desktop.ip);

      const manager = new SyncManager();
      syncManagerRef.current = manager;

      await manager.initialize(adapter);

      setStep('syncing');
      setSyncDetails('Sincronizando dados...');

      await manager.syncAll();

      setStep('success');
      setSyncDetails('Sincronização concluída com sucesso!');

      setTimeout(() => {
        router.replace('/(auth)/login' as any);
      }, 1500);
    } catch (error) {
      setStep('error');
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao sincronizar');
      setSyncDetails('');
    }
  }, [router]);

  const getStatusIcon = () => {
    switch (step) {
      case 'discovering': return 'wifi-find';
      case 'connecting': return 'link';
      case 'syncing': return 'sync';
      case 'success': return 'check-circle';
      case 'error': return 'error';
      default: return 'cloud-download';
    }
  };

  const getStatusColor = () => {
    switch (step) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return colors.primary;
    }
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <MaterialIcons
          name={getStatusIcon()}
          size={80}
          color={getStatusColor()}
        />

        <Text className="text-2xl font-bold text-foreground mt-6 text-center">
          Bem-vindo ao VendaFácil
        </Text>

        <Text className="text-base text-foreground mt-3 text-center leading-6">
          Conecte-se ao computador onde o VendaFácil Desktop está rodando na mesma rede para sincronizar seus dados.
        </Text>

        {(step === 'discovering' || step === 'connecting' || step === 'syncing') && (
          <View className="flex-row items-center gap-3 mt-8">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-sm text-foreground">{syncDetails}</Text>
          </View>
        )}

        {step === 'error' && (
          <View className="mt-6 w-full max-w-sm">
            <View className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
              <Text className="text-red-500 text-sm text-center">{errorMsg}</Text>
            </View>
          </View>
        )}

        {step === 'success' && (
          <Text className="text-base text-green-500 mt-6">
            {syncDetails}
          </Text>
        )}

        {(step === 'idle' || step === 'error') && (
          <Pressable
            onPress={handleSync}
            className="mt-8 bg-primary px-8 py-4 rounded-xl w-full max-w-sm"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-primary-foreground text-center font-semibold text-base">
              {step === 'error' ? 'Tentar Novamente' : 'Sincronizar Agora'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
