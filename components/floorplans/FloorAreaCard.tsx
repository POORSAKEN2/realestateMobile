import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { FloorArea, FloorPlanDrawingMode } from "../../types";

export function FloorAreaCard({
  area,
  hidden,
  onDelete,
  onDraw,
  onManageRooms,
  onRename,
  onToggleVisibility,
  roomCount,
}: {
  area: FloorArea;
  hidden: boolean;
  onDelete: () => void;
  onDraw: (mode: FloorPlanDrawingMode) => void;
  onManageRooms?: () => void;
  onRename: () => void;
  onToggleVisibility: () => void;
  roomCount: number;
}) {
  return (
    <View className="rounded-[24px] border border-slate-200 bg-white p-4">
      <View className="flex-row items-start gap-3">
        <View className="mt-1 h-4 w-4 rounded-full border-[3px] border-primary bg-secondary/30" />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="min-w-0 flex-1 font-ralewayBold text-base text-textPrimary"
              numberOfLines={1}
            >
              {area.label}
            </Text>
            <View
              className={`rounded-full px-2 py-1 ${
                area.points.length >= 3 ? "bg-teal-50" : "bg-amber-50"
              }`}
            >
              <Text
                className={`font-ralewayBold text-[9px] uppercase ${
                  area.points.length >= 3 ? "text-teal-700" : "text-amber-700"
                }`}
              >
                {area.points.length >= 3 ? "Mapped" : "Unmapped"}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-slate-500">
            {onManageRooms
              ? `${roomCount} ${roomCount === 1 ? "room" : "rooms"} · `
              : ""}
            {hidden ? "shape hidden" : "shape visible"}
          </Text>
        </View>
        <IconButton
          icon={hidden ? "eye-off-outline" : "eye-outline"}
          label={hidden ? "Show area shape" : "Hide area shape"}
          onPress={onToggleVisibility}
        />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2 border-t border-slate-100 pt-3">
        <AreaAction
          icon="vector-square"
          label="Rectangle"
          onPress={() => onDraw("rectangle")}
        />
        <AreaAction
          icon="vector-polygon"
          label="Polygon"
          onPress={() => onDraw("polygon")}
        />
        {onManageRooms ? (
          <AreaAction icon="door-open" label="Rooms" onPress={onManageRooms} />
        ) : null}
        <AreaAction icon="pencil-outline" label="Rename" onPress={onRename} />
        <AreaAction
          danger
          icon="trash-can-outline"
          label="Delete"
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

export function IconButton({
  danger = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      className={`h-11 w-11 items-center justify-center rounded-xl ${
        danger ? "bg-red-50" : "bg-slate-100"
      }`}
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

function AreaAction({
  danger = false,
  icon,
  label,
  onPress,
}: {
  danger?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      className={`h-11 flex-row items-center gap-1.5 rounded-xl px-3 ${
        danger ? "bg-red-50" : "bg-secondary/15"
      }`}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        color={danger ? "#DC2626" : "#634CE4"}
        size={15}
      />
      <Text
        className={`font-ralewayBold text-xs ${
          danger ? "text-red-600" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
