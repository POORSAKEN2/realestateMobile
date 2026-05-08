import { Link, router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../components/ui/Button';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const { signIn } = useAuth();

  function handleRegister() {
    signIn();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View>
          <Text className="text-4xl font-bold text-white">Create account</Text>
          <Text className="mt-3 text-base leading-6 text-slate-300">
            Start with a temporary account flow while the backend is connected.
          </Text>
        </View>

        <View className="gap-3">
          <Button title="Create account" onPress={handleRegister} />
          <Link href="/(auth)/login" asChild>
            <Text className="text-center text-base font-semibold text-teal-300">
              Already have an account?
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
