import { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@shared/hooks/use-auth';
import { AuthService } from '@shared/lib/auth-service';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsers, setHasUsers] = useState(true);

  useEffect(() => {
    AuthService.hasUsers().then(setHasUsers);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      setError('Preencha usuário e senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(username.trim(), password);
      if (user) {
        const hasDashboard = user.permissions.includes('*') || user.permissions.includes('dashboard.view');
        router.replace((hasDashboard ? '/(tabs)' : '/(tabs)/sales') as any);
      } else {
        setError('Usuário ou senha inválidos');
      }
    } catch {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }, [username, password, login, router]);

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
        <MaterialIcons name="lock" size={64} color={colors.primary} />

        <Text className="text-2xl font-bold text-foreground mt-6">
          Entrar
        </Text>

        <Text className="text-base text-foreground mt-2">
          Digite suas credenciais do Venda Fácil
        </Text>

        <View className="w-full max-w-sm mt-8 gap-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-1.5">
              Usuário
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu usuário"
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

          {error ? (
            <View className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
              <Text className="text-red-500 text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="bg-primary rounded-xl py-4 mt-2 w-full"
            style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-foreground text-center font-semibold text-base">
                Entrar
              </Text>
            )}
          </Pressable>

          {!hasUsers && (
            <Pressable
              onPress={() => router.replace('/(auth)/sync-initial' as any)}
              className="mt-2"
            >
              <Text className="text-foreground text-center text-sm">
                Sincronizar com o Desktop
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
