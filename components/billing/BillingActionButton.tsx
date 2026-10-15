import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { colors } from "../../constants/colors";

export function BillingActionButton({
  label,
  icon,
  onPress,
  primary = false,
  strong = false,
  disabled = false,
  isLoading = false,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  primary?: boolean;
  strong?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const blocked = disabled || isLoading;
  const color = strong
    ? colors.onInverse
    : primary
      ? colors.whitePrimary
      : colors.primary;
  const surfaceClassName = strong
    ? "border-primaryContent bg-primaryContent"
    : primary
      ? "border-primary bg-primary"
      : "border-primary/20 bg-panel";
  const textClassName = strong
    ? "text-onInverse"
    : primary
      ? "text-white"
      : "text-primary";
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isLoading, disabled: blocked }}
      activeOpacity={0.8}
      className={`${strong ? "min-h-14" : "min-h-12"} flex-row items-center justify-center gap-2 rounded-2xl border px-4 py-3 ${surfaceClassName} ${blocked ? "opacity-60" : ""}`}
      disabled={blocked}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color={color} size="small" />
      ) : icon ? (
        <Feather name={icon} color={color} size={17} />
      ) : null}
      <Text
        className={`min-w-0 shrink text-center ${strong ? "font-ralewayBold text-base" : "font-ralewayExtraBold text-sm"} ${textClassName}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
