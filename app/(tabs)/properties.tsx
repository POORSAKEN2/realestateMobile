import { Text, View } from 'react-native';

import { Screen } from '../../components/ui/Screen';

export default function PropertiesScreen() {
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-3xl font-bold text-white">Properties</Text>
        <Text className="text-base leading-6 text-slate-300">
          Property listing features can be built here.
        </Text>
      </View>
    </Screen>
  );
}
