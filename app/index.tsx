import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { hasCompletedOnboarding, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/screen-1" />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
