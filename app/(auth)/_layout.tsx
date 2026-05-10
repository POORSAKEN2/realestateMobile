import { Stack } from 'expo-router';

import { colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.whitePrimary },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.whitePrimary },
        headerTintColor: colors.black,
      }}
    />
  );
}
