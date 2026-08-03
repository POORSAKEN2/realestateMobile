import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { FloorAssignedRoomCard } from "./FloorAssignedRoomCard";
import { SwipeActionCard } from "../ui/SwipeActionCard";
import type { PropertyRoom } from "../../types";

function AssignedRoomsEmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-slate-300 px-4 py-8">
      <MaterialCommunityIcons
        name={filtered ? "magnify-close" : "door-closed"}
        color="#94A3B8"
        size={28}
      />
      <Text className="mt-3 font-ralewayBold text-sm text-slate-700">
        {filtered ? "No matching rooms" : "No rooms assigned"}
      </Text>
      <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
        {filtered
          ? "Try a different room number or status."
          : "Return to room management to generate or link one."}
      </Text>
      {filtered ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          className="mt-4 rounded-xl bg-secondary/15 px-4 py-3"
          onPress={onClearFilters}
        >
          <Text className="font-ralewayBold text-xs text-primary">
            Clear filters
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function FloorAssignedRoomsList({
  filteredRooms,
  hasActiveFilters,
  isBusy,
  onClearFilters,
  onOpenActions,
  totalCount,
}: {
  filteredRooms: PropertyRoom[];
  hasActiveFilters: boolean;
  isBusy: boolean;
  onClearFilters: () => void;
  onOpenActions: (roomId: string) => void;
  totalCount: number;
}) {
  if (!filteredRooms.length) {
    return (
      <AssignedRoomsEmptyState
        filtered={totalCount > 0 && hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <View className="gap-3">
      {filteredRooms.map((room) => (
        <SwipeActionCard
          actionAccessibilityLabel={`More actions for room ${room.roomNumber}`}
          actionIcon="dots-horizontal"
          actionLabel="More"
          disabled={isBusy}
          key={room.id}
          onAction={() => onOpenActions(room.id)}
        >
          <FloorAssignedRoomCard room={room} />
        </SwipeActionCard>
      ))}
    </View>
  );
}
