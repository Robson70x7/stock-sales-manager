import { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { SyncManager, LocalP2PSyncAdapter, DeviceDiscoveryService } from '@shared/sync';
import { AuthService } from '@shared/lib/auth-service';
import { DeviceInfo } from 'react-native-device-info';

type SyncStep = 'idle' | 'discovering' | 'connecting' | 'authenticating' | 'syncing' | 'success' | 'error';

export default function SyncInitialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const [step, setStep] = useState<SyncStep>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [syncDetails, setSyncDetails] = useState<string>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const syncManagerRef = useRef<SyncManager | null>(null);
  const discoveryRef = useRef<DeviceDiscoveryService | null>(null);

  const handleSync = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha usuário e senha');
      return;
    }

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

      setStep('authenticating');
      setSyncDetails('Autenticando...');

      const { token, user } = await manager.connectAndAuth(username.trim(), password);
      setPassword('');

      setStep('syncing');
      setSyncDetails('Sincronizando dados...');

      const result = await manager.syncAll();

      setSyncDetails(`Sincronização concluída: ${result.products} produtos, ${result.clients} clientes, ${result.tags} tags, ${result.suppliers} fornecedores`);

      await AuthService.createSessionFromUser(user, token);

      setStep('success');
      setSyncDetails('Sincronização concluída com sucesso!');

      setTimeout(() => {
        const hasDashboard = user.permissions.includes('*') || user.permissions.includes('dashboard.view');
        router.replace((hasDashboard ? '/(tabs)' : '/(tabs)/sales') as any);
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sincronizar';
      if (message.includes('autentica') || message.includes('Credenciais') || message.includes('inválidas')) {
        setStep('idle');
        setErrorMsg('Usuário ou senha inválidos. Verifique suas credenciais e tente novamente.');
        setSyncDetails('');
      } else {
        setStep('error');
        setErrorMsg(message);
        setSyncDetails('');
      }
    }
  }, [username, password, router]);

  const getStatusIcon = () => {
    switch (step) {
      case 'discovering': return 'wifi-find';
      case 'connecting': return 'link';
      case 'authenticating': return 'lock';
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
          Conecte-se ao VendaFácil Desktop na mesma rede para sincronizar seus dados.
        </Text>

        {step === 'idle' && (
          <View className="w-full max-w-sm mt-8 gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                Usuário
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Digite seu usuário do Desktop"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                style={{ borderColor: colors.border }}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                Senha
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.muted}
                secureTextEntry
                className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base"
                style={{ borderColor: colors.border }}
              />
            </View>

            {errorMsg ? (
              <View className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                <Text className="text-red-500 text-sm text-center">{errorMsg}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSync}
              className="mt-2 bg-primary px-8 py-4 rounded-xl w-full"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary-foreground text-center font-semibold text-base">
                Conectar e Sincronizar
              </Text>
            </Pressable>
          </View>
        )}

        {(step === 'discovering' || step === 'connecting' || step === 'authenticating' || step === 'syncing') && (
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
            <Pressable
              onPress={() => { setStep('idle'); setErrorMsg(''); }}
              className="mt-4 bg-primary px-8 py-4 rounded-xl w-full"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-primary-foreground text-center font-semibold text-base">
                Tentar Novamente
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'success' && (
          <Text className="text-base text-green-500 mt-6">
            {syncDetails}
          </Text>
        )}
      </View>
    </View>
  );
}
