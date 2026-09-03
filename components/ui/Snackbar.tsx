import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";

export type SnackbarAction = {
  label: string;
  onPress: () => void;
};

export type SnackbarProps = {
  action?: SnackbarAction;
  className?: string;
  dismissAccessibilityLabel?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  message: string;
  onDismiss?: () => void;
};

export type ScreenSnackbarPlacement = "above-navigation" | "screen-bottom";

const SCREEN_PLACEMENT_CLASSES: Record<ScreenSnackbarPlacement, string> = {
  "above-navigation": "bottom-40",
  "screen-bottom": "bottom-6",
};

export function Snackbar({
  action,
  className = "",
  dismissAccessibilityLabel = "Dismiss notification",
  icon = "check-circle-outline",
  message,
  onDismiss,
}: SnackbarProps) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className={`flex-row items-center gap-3 rounded-2xl bg-textPrimary px-4 py-3 shadow-lg shadow-primary/20 ${className}`}
    >
      <MaterialCommunityIcons name={icon} color={colors.accent} size={20} />
      <Text className="min-w-0 flex-1 font-ralewayBold text-sm text-whitePrimary">
        {message}
      </Text>
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          hitSlop={8}
          onPress={action.onPress}
        >
          <Text className="font-ralewayExtraBold text-xs text-accent">
            {action.label}
          </Text>
        </TouchableOpacity>
      ) : null}
      {onDismiss ? (
        <TouchableOpacity
          accessibilityLabel={dismissAccessibilityLabel}
          accessibilityRole="button"
          activeOpacity={0.8}
          hitSlop={8}
          onPress={onDismiss}
        >
          <MaterialCommunityIcons
            name="close"
            color={colors.accent}
            size={18}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function ScreenSnackbar({
  className = "",
  placement = "above-navigation",
  ...props
}: SnackbarProps & { placement?: ScreenSnackbarPlacement }) {
  return (
    <Snackbar
      {...props}
      className={`absolute left-4 right-4 z-50 ${SCREEN_PLACEMENT_CLASSES[placement]} ${className}`}
    />
  );
}
