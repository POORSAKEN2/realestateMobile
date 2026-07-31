import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

import { colors } from "../../../constants/colors";

export type BackButtonVariant = "neutral" | "primary" | "secondary" | "overlay";

type BackButtonProps = {
  accessibilityLabel?: string;
  onPress: () => void;
  variant?: BackButtonVariant;
};

const iconColors: Record<BackButtonVariant, string> = {
  neutral: colors.text,
  primary: colors.primary,
  secondary: colors.secondary,
  overlay: colors.primary,
};

export function BackButton({
  accessibilityLabel = "Go back",
  onPress,
  variant = "neutral",
}: BackButtonProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.76}
      hitSlop={8}
      onPress={onPress}
      style={styles.button}
    >
      <Ionicons name="chevron-back" color={iconColors[variant]} size={24} />
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
});
