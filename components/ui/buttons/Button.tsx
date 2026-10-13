import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors } from "../../../constants/colors";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  compact?: boolean;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  leadingIcon,
  compact = false,
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
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      className={`${leadingIcon || compact ? "min-h-12 py-3" : "h-12"} items-center justify-center rounded-lg ${compact ? "self-stretch px-3" : "px-5"} ${buttonClassName} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled || isLoading}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.whitePrimary : colors.primary}
        />
      ) : leadingIcon ? (
        <View className="w-full min-w-0 flex-row items-center justify-center gap-2">
          <View
            accessibilityElementsHidden
            className="shrink-0"
            importantForAccessibility="no-hide-descendants"
          >
            {leadingIcon}
          </View>
          <Text
            className={`min-w-0 shrink text-center font-ralewayBold text-base ${textClassName}`}
          >
            {title}
          </Text>
        </View>
      ) : (
        <Text
          className={`font-ralewayBold text-base ${compact ? "min-w-0 shrink text-center" : ""} ${textClassName}`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
