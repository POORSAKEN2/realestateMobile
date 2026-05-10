import { Tabs } from 'expo-router';

import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.whitePrimary },
        headerTintColor: colors.black,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.description,
        tabBarStyle: {
          backgroundColor: colors.whitePrimary,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen
        name="index"
        options={{ href: null, title: 'Home' }}
      />
      <Tabs.Screen name="properties" options={{ title: 'Properties' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
