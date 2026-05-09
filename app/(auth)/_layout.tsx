import { Stack } from 'expo-router';

import { colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.black },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.black },
        headerTintColor: colors.whitePrimary,
      }}
    />
  );
}
