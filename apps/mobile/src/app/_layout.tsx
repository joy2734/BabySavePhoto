import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1759D7',
        tabBarInactiveTintColor: '#7D8799',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E8EDF5', height: 64 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
      }}>
        <Tabs.Screen name="index" options={{ title: '홈' }} />
        <Tabs.Screen name="explore" options={{ title: '서버 연결' }} />
      </Tabs>
    </>
  );
}