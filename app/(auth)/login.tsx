import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();

  function handleLogin() {
    signIn();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View>
          <Text className="text-4xl font-bold text-white">Welcome back</Text>
          <Text className="mt-3 text-base leading-6 text-slate-300">
            Sign in to continue managing your real estate workspace.
          </Text>
        </View>

        <View className="gap-3">
          <Button title="Sign in" onPress={handleLogin} />
          <Link href="/(auth)/register" asChild>
            <Text className="text-center text-base font-semibold text-teal-300">
              Create an account
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
