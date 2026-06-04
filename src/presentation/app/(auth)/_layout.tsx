import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sync-initial" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
