import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

function FloorAreaActionButton({
  disabled = false,
  icon,
  label,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const color = primary ? "#FFFFFF" : "#8A77F4";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
      className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 ${
        primary ? "bg-primary" : "bg-primary/15"
      } ${disabled ? "opacity-40" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} color={color} size={17} />
      <Text
        className={`font-ralewayBold text-xs ${primary ? "text-white" : "text-primary"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function FloorAreaCardActions({
  canDraw,
  hasShape,
  onChooseShape,
  onManageRooms,
}: {
  canDraw: boolean;
  hasShape: boolean;
  onChooseShape: () => void;
  onManageRooms?: () => void;
}) {
  return (
    <View className="mt-4 flex-row gap-2 border-t border-slate-100 pt-3">
      <FloorAreaActionButton
        disabled={!canDraw}
        icon={canDraw ? "vector-combine" : "image-off-outline"}
        label={
          canDraw ? (hasShape ? "Edit shape" : "Map shape") : "Image required"
        }
        onPress={onChooseShape}
        primary
      />
      {onManageRooms ? (
        <FloorAreaActionButton
          icon="door-open"
          label="Rooms"
          onPress={onManageRooms}
        />
      ) : null}
    </View>
  );
}
