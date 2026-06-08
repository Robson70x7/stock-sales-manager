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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

interface SyncDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop';
  ip?: string;
}

interface SyncResult {
  products: number;
  clients: number;
  tags: number;
  suppliers: number;
  clientsSent: number;
  sales: number;
}

interface SyncModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: (deviceId: string) => Promise<void>;
  onSync: () => Promise<SyncResult | void>;
  onScan: () => Promise<void>;
  onAuthenticate: (username: string, password: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  devices: SyncDevice[];
  connected: boolean;
  needsAuth: boolean;
  syncStatus: 'idle' | 'syncing' | 'connected' | 'error';
  error?: string;
  defaultUsername?: string;
}

export function SyncModal({
  visible,
  onClose,
  onConnect,
  onSync,
  onScan,
  onAuthenticate,
  onDisconnect,
  devices,
  connected,
  needsAuth,
  syncStatus,
  error,
  defaultUsername,
}: SyncModalProps) {
  const colors = useColors();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authing, setAuthing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedDevice(null);
      setScanning(false);
      setConnecting(false);
      setSyncing(false);
      setDisconnecting(false);
      setSyncResult(null);
      setAuthUsername('');
      setAuthPassword('');
      setAuthing(false);
      setAuthError(null);
    } else if (defaultUsername) {
      setAuthUsername(defaultUsername);
    }
  }, [visible, defaultUsername]);

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

  const handleAuthenticateSubmit = async () => {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError('Preencha usuário e senha');
      return;
    }

    setAuthing(true);
    setAuthError(null);
    try {
      await onAuthenticate(authUsername.trim(), authPassword.trim());
      setAuthPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação';
      setAuthError(message);
    } finally {
      setAuthing(false);
    }
  };

  const handleDisconnectAction = async () => {
    setDisconnecting(true);
    try {
      await onDisconnect();
    } catch {
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await onSync();
      if (result) setSyncResult(result);
    } catch {
      Alert.alert('Erro', 'Falha ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const isConnectedAndAuthed = connected && !needsAuth;

  const renderStatusBadge = () => {
    if (syncStatus === 'syncing') {
      return (
        <>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.primary }]}>
            Sincronizando...
          </Text>
        </>
      );
    }
    if (syncStatus === 'connected' && needsAuth) {
      return (
        <>
          <MaterialIcons name="warning" size={16} color="#eab308" />
          <Text style={[styles.statusText, { color: '#eab308' }]}>
            Autenticação necessária
          </Text>
        </>
      );
    }
    if (syncStatus === 'connected') {
      return (
        <>
          <MaterialIcons name="check-circle" size={16} color="#10b981" />
          <Text style={[styles.statusText, { color: '#10b981' }]}>
            Conectado
          </Text>
        </>
      );
    }
    if (syncStatus === 'idle') {
      return (
        <>
          <MaterialIcons name="radio-button-unchecked" size={16} color={colors.muted} />
          <Text style={[styles.statusText, { color: colors.muted }]}>
            Desconectado
          </Text>
        </>
      );
    }
    return (
      <>
        <MaterialIcons name="error" size={16} color="#ef4444" />
        <Text style={[styles.statusText, { color: '#ef4444' }]}>
          Erro
        </Text>
      </>
    );
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
                {renderStatusBadge()}
              </View>
            </View>
          </View>

          {error && (
            <View style={[styles.errorCard, { backgroundColor: '#7f1d1d' }]}>
              <MaterialIcons name="error-outline" size={20} color="#fca5a5" />
              <Text style={[styles.errorText, { color: '#fca5a5' }]}>{error}</Text>
            </View>
          )}

          {/* Autenticação */}
          {connected && needsAuth && (
            <View style={[styles.authCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.authTitle, { color: colors.foreground }]}>
                Autenticação necessária
              </Text>
              <Text style={[styles.authDescription, { color: colors.muted }]}>
                Informe suas credenciais do Desktop para autenticar a conexão.
              </Text>

              {authError && (
                <View style={[styles.authErrorBox, { backgroundColor: '#7f1d1d' }]}>
                  <Text style={[styles.authErrorText, { color: '#fca5a5' }]}>{authError}</Text>
                </View>
              )}

              <View style={styles.authFields}>
                <View>
                  <Text style={[styles.authLabel, { color: colors.muted }]}>Usuário</Text>
                  <TextInput
                    value={authUsername}
                    onChangeText={(t) => { setAuthUsername(t); setAuthError(null); }}
                    placeholder="Digite seu usuário do Desktop"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!authing}
                    style={[
                      styles.authInput,
                      { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
                    ]}
                  />
                </View>
                <View>
                  <Text style={[styles.authLabel, { color: colors.muted }]}>Senha</Text>
                  <TextInput
                    value={authPassword}
                    onChangeText={(t) => { setAuthPassword(t); setAuthError(null); }}
                    placeholder="Digite sua senha"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    editable={!authing}
                    style={[
                      styles.authInput,
                      { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
                    ]}
                  />
                </View>
              </View>
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

          {/* Resultado */}
          {syncResult && (
            <View style={[styles.resultCard, { backgroundColor: colors.surface }]}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="check-circle" size={20} color="#10b981" />
                <Text style={[styles.resultTitle, { color: '#10b981' }]}>
                  Sincronização concluída
                </Text>
              </View>
              <View style={styles.resultBody}>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.muted }]}>Produtos</Text>
                  <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.products}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.muted }]}>Clientes</Text>
                  <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.clients}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.muted }]}>Tags</Text>
                  <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.tags}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: colors.muted }]}>Fornecedores</Text>
                  <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.suppliers}</Text>
                </View>
                <View style={[styles.resultRow, styles.resultRowLast]}>
                  <Text style={[styles.resultLabel, { color: colors.muted }]}>Vendas enviadas</Text>
                  <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.sales}</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { color: colors.muted }]}>Clientes enviados</Text>
                    <Text style={[styles.resultValue, { color: colors.foreground }]}>{syncResult.clientsSent}</Text>
                  </View>
              </View>
            </View>
          )}

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
          {isConnectedAndAuthed ? (
            <>
              <Pressable
                onPress={handleDisconnectAction}
                disabled={disconnecting}
                style={[
                  styles.btn,
                  {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.primary,
                    opacity: disconnecting ? 0.5 : 1,
                  },
                ]}
              >
                {disconnecting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primary }]}>Desconectar</Text>
                )}
              </Pressable>
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
            </>
          ) : connected && needsAuth ? (
            <Pressable
              onPress={handleAuthenticateSubmit}
              disabled={authing}
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  opacity: authing ? 0.5 : 1,
                },
              ]}
            >
              {authing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.btnText, { color: 'white' }]}>Autenticar</Text>
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
  authCard: {
    padding: 16,
    borderRadius: 8,
  },
  authTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  authDescription: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  authErrorBox: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  authErrorText: {
    fontSize: 13,
  },
  authFields: {
    gap: 12,
  },
  authLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  authInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
  resultCard: {
    padding: 12,
    borderRadius: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultBody: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.3)',
    paddingTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  resultRowLast: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.3)',
    marginTop: 4,
    paddingTop: 10,
  },
  resultLabel: {
    fontSize: 13,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
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
