import { Tabs } from 'expo-router';

import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.black },
        headerTintColor: colors.whitePrimary,
        tabBarActiveTintColor: colors.darkBluePrimary,
        tabBarInactiveTintColor: colors.description,
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopColor: colors.description,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="properties" options={{ title: 'Properties' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
