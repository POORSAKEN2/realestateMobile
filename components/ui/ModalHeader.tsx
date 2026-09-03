import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";

type ModalHeaderProps = {
  accessory?: ReactNode;
  className?: string;
  closeAccessibilityLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  onClose: () => void;
  subtitle?: string;
  title: string;
};

export function ModalHeader({
  accessory,
  className = "",
  closeAccessibilityLabel = "Close",
  compact = false,
  disabled = false,
  leading,
  onClose,
  subtitle,
  title,
}: ModalHeaderProps) {
  return (
    <View
      className={`border-b border-primary/10 bg-white ${
        compact ? "px-5 pb-3 pt-3" : "px-6 pb-4 pt-3"
      } ${className}`}
    >
      <View className="flex-row items-center gap-4">
        {leading ? <View className="shrink-0">{leading}</View> : null}
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className={`font-ralewayExtraBold tracking-tight text-textPrimary ${
              compact ? "text-xl leading-7" : "text-2xl leading-8"
            }`}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-1 font-ralewayMedium text-sm leading-5 text-description"
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {accessory ? <View className="shrink-0">{accessory}</View> : null}
        <TouchableOpacity
          accessibilityLabel={closeAccessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          activeOpacity={0.76}
          className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ${
            disabled ? "opacity-50" : ""
          }`}
          disabled={disabled}
          hitSlop={8}
          onPress={onClose}
        >
          <Ionicons name="close" color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
