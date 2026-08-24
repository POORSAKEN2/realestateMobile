import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const color = danger ? "#DC2626" : selected ? "#8A77F4" : "#475569";

  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      activeOpacity={0.8}
      className={`h-11 w-11 items-center justify-center rounded-xl ${
        danger ? "bg-red-50" : selected ? "bg-primary/15" : "bg-slate-100"
      } ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} color={color} size={18} />
    </TouchableOpacity>
  );
}
