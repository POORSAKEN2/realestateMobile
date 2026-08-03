import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

export function FloorPlanIconButton({
  danger = false,
  disabled = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      className={`h-11 w-11 items-center justify-center rounded-xl ${
        danger ? "bg-red-50" : "bg-slate-100"
      } ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        color={danger ? "#DC2626" : "#475569"}
        size={18}
      />
    </TouchableOpacity>
  );
}
