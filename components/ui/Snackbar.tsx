import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContext } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../../constants/colors";
import { ScreenOverlayInsetContext } from "../../context/ScreenOverlayInsetContext";
import {
  getSnackbarBottomOffset,
  type ScreenSnackbarPlacement,
} from "../../utils/snackbarPlacement";

export type { ScreenSnackbarPlacement } from "../../utils/snackbarPlacement";

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
  style?: StyleProp<ViewStyle>;
};

export function Snackbar({
  action,
  className = "",
  dismissAccessibilityLabel = "Dismiss notification",
  icon = "check-circle-outline",
  message,
  onDismiss,
  style,
}: SnackbarProps) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className={`flex-row items-center gap-3 rounded-2xl bg-overlay px-4 py-3 shadow-lg shadow-primary/20 ${className}`}
      style={style}
    >
      <MaterialCommunityIcons
        name={icon}
        color={colors.overlayAccent}
        size={20}
      />
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
          <Text className="font-ralewayExtraBold text-xs text-overlayAccent">
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
            color={colors.overlayAccent}
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
  bottomClearance = 0,
  style,
  ...props
}: SnackbarProps & {
  placement?: ScreenSnackbarPlacement;
  /** Height occupied by a sticky footer, measured from screen bottom. */
  bottomClearance?: number;
}) {
  const insets = useContext(ScreenOverlayInsetContext);
  return (
    <Snackbar
      {...props}
      className={`absolute left-4 right-4 z-50 ${className}`}
      style={[
        {
          bottom: getSnackbarBottomOffset({
            navigationInset: insets.navigation,
            safeAreaInset: insets.safeArea,
            bottomClearance,
            placement,
          }),
        },
        style,
      ]}
    />
  );
}
