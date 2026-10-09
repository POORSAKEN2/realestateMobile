import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { TouchableOpacity } from "react-native";

export function FloorPlanIconButton({
  danger = false,
  disabled = false,
  icon,
  label,
  onPress,
  selected = false,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const color = danger ? colors.danger : colors.primary;

  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      activeOpacity={0.8}
      className={`h-11 w-11 items-center justify-center rounded-xl ${
        danger ? "bg-dangerSurface" : "bg-iconSurface"
      } ${selected ? "border border-primary" : ""} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} color={color} size={18} />
    </TouchableOpacity>
  );
}
