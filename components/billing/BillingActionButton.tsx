import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { colors } from "../../constants/colors";

export function BillingActionButton({
  label,
  icon,
  onPress,
  primary = false,
  disabled = false,
  isLoading = false,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const blocked = disabled || isLoading;
  const color = primary ? colors.whitePrimary : colors.primary;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: isLoading, disabled: blocked }}
      activeOpacity={0.8}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border px-4 py-3 ${primary ? "border-primary bg-primary" : "border-primary/20 bg-white"} ${blocked ? "opacity-60" : ""}`}
      disabled={blocked}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator color={color} size="small" />
      ) : icon ? (
        <Feather name={icon} color={color} size={17} />
      ) : null}
      <Text
        className={`text-center font-ralewayExtraBold text-sm ${primary ? "text-white" : "text-primary"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
