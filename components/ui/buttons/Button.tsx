import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors } from "../../../constants/colors";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
}: ButtonProps) {
  const buttonClassName =
    variant === "primary"
      ? "bg-primary active:opacity-90"
      : "border border-primary bg-panel active:bg-primary/10";

  const textClassName =
    variant === "primary" ? "text-whitePrimary" : "text-primaryContent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      className={`h-12 items-center justify-center rounded-lg px-5 ${buttonClassName} ${disabled ? 'opacity-50' : ''}`}
      disabled={disabled || isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.whitePrimary : colors.primary}
        />
      ) : (
        <Text className={`font-ralewayBold text-base ${textClassName}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
