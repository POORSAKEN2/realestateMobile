import { PermissionGate } from "../auth/PermissionGate";
import { View, Text } from "react-native";

import { FloorPlanIconButton } from "./FloorPlanIconButton";
import type { FloorPlan, PropertyRoom } from "../../types";
import { getFloorRoomCount } from "../../utils/floorplans/floorPlanPresentation";

export function FloorPlanActionsCard({
  canToggleAreaShapes,
  floor,
  onDelete,
  onPickImage,
  onRename,
  onToggleAreaShapes,
  rooms,
  showAreaShapes,
}: {
  canToggleAreaShapes: boolean;
  floor: FloorPlan;
  onDelete: () => void;
  onPickImage: () => void;
  onRename: () => void;
  onToggleAreaShapes: () => void;
  rooms: PropertyRoom[];
  showAreaShapes: boolean;
}) {
  const roomCount = getFloorRoomCount(floor, rooms);

  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-primary/20 bg-white p-3 shadow-sm shadow-primary/10">
      <View className="min-w-0 flex-1">
        <Text
          className="font-ralewayBold text-base text-textPrimary"
          numberOfLines={1}
        >
          {floor.name}
        </Text>
        <Text className="mt-0.5 text-xs text-description">
          {floor.areas.length} {floor.areas.length === 1 ? "area" : "areas"} ·{" "}
          {roomCount} {roomCount === 1 ? "room" : "rooms"}
        </Text>
      </View>
      <View className="flex-row gap-1">
        <FloorPlanIconButton
          disabled={!canToggleAreaShapes}
          icon={showAreaShapes ? "eye-off-outline" : "eye-outline"}
          label={showAreaShapes ? "Hide area shapes" : "Show area shapes"}
          onPress={onToggleAreaShapes}
          selected={showAreaShapes}
        />
        <PermissionGate permission="floorplans.update" propertyId={floor.propertyId}><FloorPlanIconButton
          icon="image-outline"
          label={
            floor.image ? "Change floor plan image" : "Upload floor plan image"
          }
          onPress={onPickImage}
        /></PermissionGate>
        <PermissionGate permission="floorplans.update" propertyId={floor.propertyId}><FloorPlanIconButton
          icon="pencil-outline"
          label="Rename floor"
          onPress={onRename}
        /></PermissionGate>
        <PermissionGate permission="floorplans.delete" propertyId={floor.propertyId}><FloorPlanIconButton
          danger
          icon="trash-can-outline"
          label="Delete floor"
          onPress={onDelete}
        /></PermissionGate>
      </View>
    </View>
  );
}
