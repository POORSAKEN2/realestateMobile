import { Redirect } from 'expo-router';

import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { hasCompletedOnboarding, isAuthenticated } = useAuth();

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/screen-1" />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
