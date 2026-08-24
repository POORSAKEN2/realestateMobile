import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { PropertyRoom, PropertyRoomStatus } from "../../types";
import { getRoomStatusLabel } from "../../utils/floorplans/floorPlanPresentation";

const STATUS_STYLES: Record<
  PropertyRoomStatus,
  { container: string; dot: string; text: string }
> = {
  Maintenance: {
    container: "border-amber-200 bg-amber-50",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  Occupied: {
    container: "border-blue-200 bg-blue-50",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  Vacant: {
    container: "border-emerald-200 bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
};

export function FloorAssignedRoomCard({ room }: { room: PropertyRoom }) {
  const statusStyle = STATUS_STYLES[room.status];

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
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
          <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
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
    </View>
  );
}
