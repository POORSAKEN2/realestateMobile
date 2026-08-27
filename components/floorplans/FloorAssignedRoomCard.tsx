import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { PropertyRoom, PropertyRoomStatus } from "../../types";
import { getRoomStatusLabel } from "../../utils/floorplans/floorPlanPresentation";

const STATUS_STYLES: Record<
  PropertyRoomStatus,
  { container: string; dot: string; text: string }
> = {
  Maintenance: {
    container: "border-warning/25 bg-warningSurface",
    dot: "bg-warning",
    text: "text-warning",
  },
  Occupied: {
    container: "border-info/20 bg-infoSurface",
    dot: "bg-info",
    text: "text-info",
  },
  Vacant: {
    container: "border-success/25 bg-successSurface",
    dot: "bg-success",
    text: "text-success",
  },
};

export function FloorAssignedRoomCard({
  onManageBedspaces,
  room,
}: {
  onManageBedspaces: () => void;
  room: PropertyRoom;
}) {
  const statusStyle = STATUS_STYLES[room.status];

  return (
    <View className="rounded-2xl border border-textPrimary/10 bg-white p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <MaterialCommunityIcons name="door" color="#8A77F4" size={20} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="font-ralewayBold text-base text-textPrimary"
            numberOfLines={1}
          >
            {room.roomNumber}
          </Text>
          <Text className="mt-0.5 text-xs text-description" numberOfLines={1}>
            {room.type || "Assigned to this area"}
          </Text>
        </View>
        <View
          accessibilityLabel={`Status: ${getRoomStatusLabel(room.status)}`}
          className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-2 ${statusStyle.container}`}
        >
          <View className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
          <Text
            className={`font-ralewayBold text-xs ${statusStyle.text}`}
            numberOfLines={1}
          >
            {getRoomStatusLabel(room.status)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        accessibilityLabel={`Manage bedspaces for room ${room.roomNumber}`}
        accessibilityRole="button"
        activeOpacity={0.8}
        className="mt-3 flex-row items-center gap-3 rounded-xl bg-primary/10 px-3 py-3"
        onPress={onManageBedspaces}
      >
        <MaterialCommunityIcons
          name="bed-single-outline"
          color="#8A77F4"
          size={18}
        />
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-xs text-secondary">
            {room.bedspaceCount > 0
              ? `Manage ${room.bedspaceCount} ${room.bedspaceCount === 1 ? "bedspace" : "bedspaces"}`
              : "Set up bedspaces"}
          </Text>
          <Text className="mt-0.5 text-[11px] text-description">
            {room.bedspaceCount > 0
              ? `${room.vacantBedspaceCount} vacant · ${room.occupiedBedspaceCount} occupied`
              : "No bedspaces configured for this room"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          color="#8A77F4"
          size={19}
        />
      </TouchableOpacity>
    </View>
  );
}
