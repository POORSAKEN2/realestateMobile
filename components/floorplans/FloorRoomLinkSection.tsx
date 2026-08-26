import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";

import AddButton from "../ui/buttons/AddButton";
import { DropdownField } from "../ui/fields/DropdownField";
import type { PropertyRoom } from "../../types";

export function FloorRoomLinkSection({
  availableRooms,
  floorName,
  isBusy,
  isLinking,
  onLink,
  onSelect,
  selectedRoomId,
}: {
  availableRooms: PropertyRoom[];
  floorName?: string;
  isBusy: boolean;
  isLinking: boolean;
  onLink: () => void;
  onSelect: (roomId: string) => void;
  selectedRoomId: string;
}) {
  const roomOptions = useMemo(
    () =>
      availableRooms.map((room) => ({
        label: `Room ${room.roomNumber}`,
        value: room.id,
      })),
    [availableRooms],
  );

  return (
    <View className="pt-1">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name="link-variant" color="#8A77F4" size={21} />
        <Text className="font-ralewayBold text-base text-textPrimary">
          Link existing room
        </Text>
      </View>
      <Text className="mt-2 text-xs leading-5 text-description">
        Assign an unassigned room from {floorName ?? "this floor"} to this area.
      </Text>

      {roomOptions.length ? (
        <View className="mt-3 flex-row items-end gap-3 rounded-2xl border border-textPrimary/10 bg-white p-3">
          <DropdownField
            label="Unassigned room"
            onSelect={onSelect}
            options={roomOptions}
            placeholder="Select room"
            value={selectedRoomId}
            variant="filled"
            wrapperClassName="min-w-0 flex-1"
          />
          <AddButton
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5"
            disabled={!selectedRoomId || isBusy}
            iconName="link-variant"
            loading={isLinking}
            onPress={onLink}
            title="Link"
          />
        </View>
      ) : (
        <View className="mt-3 items-center rounded-2xl border border-dashed border-textPrimary/20 px-4 py-5">
          <Text className="font-ralewayBold text-sm text-textPrimary">
            No unassigned rooms on this floor
          </Text>
          <Text className="mt-1 text-center text-xs leading-5 text-description">
            Create a room or unassign one from another area first.
          </Text>
        </View>
      )}
    </View>
  );
}
