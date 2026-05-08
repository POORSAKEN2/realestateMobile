import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  function handleSignOut() {
    signOut();
    router.replace('/(auth)/login');
  }

  return (
    <Screen>
      <View className="flex-1 justify-between">
        <View className="gap-4">
          <Text className="text-3xl font-bold text-white">Profile</Text>
          <Text className="text-base leading-6 text-slate-300">
            Manage account settings and session state from this tab.
          </Text>
        </View>

        <Button title="Sign out" variant="secondary" onPress={handleSignOut} />
      </View>
    </Screen>
  );
}
