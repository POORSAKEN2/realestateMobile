import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  className?: string;
}>;

export function Screen({ children, className = '' }: ScreenProps) {
  return (
    <SafeAreaView className={`flex-1 bg-blackPrimary ${className}`}>
      <View className="flex-1 px-6 py-6">{children}</View>
    </SafeAreaView>
  );
}
