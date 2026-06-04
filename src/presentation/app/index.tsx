import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@shared/lib/auth-service';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await AuthService.getSession();
      if (session) {
        console.log(session);
        const hasDashboard = session.permissions.includes('*') || session.permissions.includes('dashboard.view');
        router.replace((hasDashboard ? '/(tabs)' : '/(tabs)/sales') as any);
      } else if (await AuthService.hasUsers()) {
        router.replace('/(auth)/login' as any);
      } else {
        router.replace('/(auth)/sync-initial' as any);
      }
    })();
  }, [router]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
