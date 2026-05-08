import { StatusBar } from 'expo-status-bar';
import './global.css';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <View className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/10 p-6">
        <Text className="text-center text-3xl font-bold text-white">
          Expo + NativeWind
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-slate-300">
          Your React Native app is ready for Expo Go with Tailwind-style
          theming.
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
