import { Stack } from 'expo-router';

export default function IndexLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 기본 화면 - index */}
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      
      {/* Result 화면을 고유한 경로로 설정 */}
      <Stack.Screen name="result" options={{ title: 'Result' }} />
    </Stack>
  );
}
