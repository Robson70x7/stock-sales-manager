import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

interface SyncDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  ip?: string;
}

interface SyncModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (deviceId: string) => Promise<void>;
  onSync: () => Promise<void>;
  onScan: () => Promise<void>;
  devices: SyncDevice[];
  connected: boolean;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
  error?: string;
}

export function SyncModal({
  visible,
  onClose,
  onConnect,
  onSync,
  onScan,
  devices,
  connected,
  syncStatus,
  error,
}: SyncModalProps) {
  const colors = useColors();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSelectedDevice(null);
      setScanning(false);
      setConnecting(false);
      setSyncing(false);
    }
  }, [visible]);

  useEffect(() => {
    if (devices.length === 1 && !selectedDevice) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await onScan();
    } catch {
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedDevice) return;

    setConnecting(true);
    try {
      await onConnect(selectedDevice);
    } catch {
      Alert.alert('Erro', 'Falha ao conectar com o dispositivo');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync();
      Alert.alert('Sucesso', 'Dados sincronizados com sucesso!');
    } catch {
      Alert.alert('Erro', 'Falha ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Sincronização de Dados
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Status */}
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.label, { color: colors.muted }]}>Status:</Text>
              <View style={styles.statusBadge}>
                {syncStatus === 'syncing' && (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.statusText, { color: colors.primary }]}>
                      Sincronizando...
                    </Text>
                  </>
                )}
                {syncStatus === 'connected' && (
                  <>
                    <MaterialIcons name="check-circle" size={16} color="#10b981" />
                    <Text style={[styles.statusText, { color: '#10b981' }]}>
                      Conectado
                    </Text>
                  </>
                )}
                {syncStatus === 'idle' && (
                  <>
                    <MaterialIcons name="radio-button-unchecked" size={16} color={colors.muted} />
                    <Text style={[styles.statusText, { color: colors.muted }]}>
                      Desconectado
                    </Text>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <MaterialIcons name="error" size={16} color="#ef4444" />
                    <Text style={[styles.statusText, { color: '#ef4444' }]}>
                      Erro
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {error && (
            <View style={[styles.errorCard, { backgroundColor: '#7f1d1d' }]}>
              <MaterialIcons name="error-outline" size={20} color="#fca5a5" />
              <Text style={[styles.errorText, { color: '#fca5a5' }]}>{error}</Text>
            </View>
          )}

          {/* Dispositivos */}
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Dispositivos Disponíveis
              </Text>
              {devices.length > 0 && (
                <Pressable onPress={handleScan} disabled={scanning} style={styles.refreshBtn}>
                  <MaterialIcons
                    name={scanning ? 'sync' : 'refresh'}
                    size={20}
                    color={scanning ? colors.muted : colors.primary}
                  />
                </Pressable>
              )}
            </View>

            {devices.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="devices" size={40} color={colors.muted} />
                {scanning ? (
                  <>
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.muted, marginTop: 8 }]}>
                      Buscando dispositivos...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.emptyText, { color: colors.muted }]}>
                      Nenhum dispositivo encontrado
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                      Certifique-se de que o outro dispositivo está na mesma rede
                    </Text>
                    <Pressable
                      onPress={handleScan}
                      style={[styles.scanBtn, { backgroundColor: colors.primary }]}
                    >
                      <MaterialIcons name="search" size={18} color="white" />
                      <Text style={styles.scanBtnText}>Buscar Dispositivos</Text>
                    </Pressable>
                  </>
                )}
              </View>
            ) : (
              devices.map(device => (
                <Pressable
                  key={device.id}
                  onPress={() => setSelectedDevice(device.id)}
                  style={[
                    styles.deviceCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        selectedDevice === device.id ? colors.primary : colors.border,
                      borderWidth: selectedDevice === device.id ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.deviceIcon}>
                    <MaterialIcons
                      name={device.type === 'mobile' ? 'smartphone' : 'desktop-mac'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.foreground }]}>
                      {device.name}
                    </Text>
                    <Text style={[styles.deviceType, { color: colors.muted }]}>
                      {device.type === 'mobile' ? 'Mobile' : 'Desktop'}
                      {device.ip && ` • ${device.ip}`}
                    </Text>
                  </View>
                  {selectedDevice === device.id && (
                    <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              ))
            )}
          </View>

          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.muted }]}>
              A sincronização funcionará apenas quando ambos os dispositivos estiverem na mesma rede local.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border, marginBottom: 50 }]}>
          <Pressable
            onPress={onClose}
            style={[styles.btn, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.btnText, { color: colors.foreground }]}>Cancelar</Text>
          </Pressable>
          {connected ? (
            <Pressable
              onPress={handleSync}
              disabled={syncing}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  opacity: syncing ? 0.5 : 1,
                },
              ]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.btnText, { color: 'white' }]}>Sincronizar</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleConnect}
              disabled={!selectedDevice || connecting}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  opacity: !selectedDevice || connecting ? 0.5 : 1,
                },
              ]}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.btnText, { color: 'white' }]}>Conectar</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    padding: 12,
    borderRadius: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  deviceIcon: {
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceType: {
    fontSize: 12,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  scanBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
