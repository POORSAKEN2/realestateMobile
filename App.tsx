import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-whitePrimary px-6">
      <View className="w-full max-w-sm rounded-2xl border border-slate-200 bg-whitePrimary p-6">
        <Text className="text-center text-3xl font-bold text-blackPrimary">
          Expo + NativeWind
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-description">
          Your React Native app is ready for Expo Go with Tailwind-style
          styling.
        </Text>
      </View>
    </View>
  );
}
