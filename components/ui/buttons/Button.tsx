import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '../../../constants/colors';

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
      ? 'bg-primary active:opacity-90'
      : 'border border-description bg-whitePrimary active:bg-slate-100';

  const textClassName =
    variant === 'primary' ? 'text-whitePrimary' : 'text-primary';

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-12 items-center justify-center rounded-lg px-5 ${buttonClassName}`}
      disabled={isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.whitePrimary : colors.primary}
        />
      ) : (
        <Text className={`text-base font-semibold ${textClassName}`}>{title}</Text>
      )}
    </Pressable>
  );
}
