import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
}: ButtonProps) {
  const buttonClassName =
    variant === 'primary'
      ? 'bg-teal-500 active:bg-teal-600'
      : 'border border-slate-600 bg-transparent active:bg-slate-800';

  const textClassName = variant === 'primary' ? 'text-slate-950' : 'text-white';

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-12 items-center justify-center rounded-lg px-5 ${buttonClassName}`}
      disabled={isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0f172a' : '#ffffff'} />
      ) : (
        <Text className={`text-base font-semibold ${textClassName}`}>{title}</Text>
      )}
    </Pressable>
  );
}
