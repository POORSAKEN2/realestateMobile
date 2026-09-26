import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

import { useThemeColors } from "../../../context/WorkspacePresentationContext";

export type BackButtonVariant = "neutral" | "primary" | "secondary" | "overlay";

type BackButtonProps = {
  accessibilityLabel?: string;
  disabled?: boolean;
  onPress: () => void;
  variant?: BackButtonVariant;
};

export function BackButton({
  accessibilityLabel = "Go back",
  disabled = false,
  onPress,
  variant = "neutral",
}: BackButtonProps) {
  const palette = useThemeColors();
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.76}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={[styles.button, disabled ? styles.disabled : undefined]}
    >
      <Ionicons name="chevron-back" color={palette.primary} size={24} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  disabled: {
    opacity: 0.5,
  },
});
