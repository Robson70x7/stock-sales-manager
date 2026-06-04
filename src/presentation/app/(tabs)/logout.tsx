import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthService } from '@shared/lib/auth-service';

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    AuthService.logout().then(() => {
      router.replace('/(auth)/login');
    });
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
