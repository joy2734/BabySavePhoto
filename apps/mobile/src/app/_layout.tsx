import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text } from 'react-native';
import { AppProvider, useApp } from '@/context/app';
import { AuthScreen } from '@/components/auth';
import { colors } from '@/components/ui';

export default function RootLayout() {
  return <AppProvider><AppShell /></AppProvider>;
}
function AppShell() {
  const { loading, user } = useApp();
  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: colors.cream }} color={colors.green} />;
  if (!user) return <AuthScreen />;
  return (
    <>
      <StatusBar style="dark" />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: colors.line, height: 66 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
      }}>
        <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: () => <Text>⌂</Text> }} />
        <Tabs.Screen name="album" options={{ title: '앨범', tabBarIcon: () => <Text>▧</Text> }} />
        <Tabs.Screen name="care" options={{ title: '육아기록', tabBarIcon: () => <Text>♡</Text> }} />
        <Tabs.Screen name="notifications" options={{ title: '알림', tabBarIcon: () => <Text>♧</Text> }} />
        <Tabs.Screen name="profile" options={{ title: '설정', tabBarIcon: () => <Text>☻</Text> }} />
      </Tabs>
    </>
  );
}
