import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6366f1', tabBarInactiveTintColor: '#9ca3af' }}>
      <Tabs.Screen name="index"    options={{ title: 'Inicio' }} />
      <Tabs.Screen name="people"   options={{ title: 'Red' }} />
      <Tabs.Screen name="senales"  options={{ title: 'Señales' }} />
      <Tabs.Screen name="estado"   options={{ title: 'Estado' }} />
      <Tabs.Screen name="config"   options={{ title: 'Config' }} />
      {/* Hidden from tab bar but still routable */}
      <Tabs.Screen name="state"    options={{ href: null }} />
      <Tabs.Screen name="memories" options={{ href: null }} />
    </Tabs>
  );
}
