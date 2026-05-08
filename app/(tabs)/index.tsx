import { Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';

export default function HomeScreen() {
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-3xl font-bold text-white">Dashboard</Text>
        <Text className="text-base leading-6 text-slate-300">
          Your Expo Router tab architecture is ready for real estate workflows.
        </Text>
      </View>
    </Screen>
  );
}
