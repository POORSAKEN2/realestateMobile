import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";

import { FloorPlanActionsCard } from "./FloorPlanActionsCard";
import { FloorPlanPreview } from "./FloorPlanPreview";
import { FloorPlanTabs } from "./FloorPlanTabs";
import type { FloorPlan, PropertyRoom } from "../../types";

export function FloorPlanWorkspace({
  activeFloor,
  floorPlans,
  hiddenAreaIds,
  onDeleteFloor,
  onManageAreas,
  onPickImage,
  onRefresh,
  onRenameFloor,
  onSelectFloor,
  refreshing,
  rooms,
}: {
  activeFloor: FloorPlan;
  floorPlans: FloorPlan[];
  hiddenAreaIds: Set<string>;
  onDeleteFloor: (floor: FloorPlan) => void;
  onManageAreas: (floor: FloorPlan) => void;
  onPickImage: () => void;
  onRefresh: () => void;
  onRenameFloor: (floor: FloorPlan) => void;
  onSelectFloor: (id: string) => void;
  refreshing: boolean;
  rooms: PropertyRoom[];
}) {
  const [showAreaShapes, setShowAreaShapes] = useState(false);
  const canToggleAreaShapes =
    Boolean(activeFloor.image) &&
    activeFloor.areas.some(
      (area) => area.points.length >= 3 && !hiddenAreaIds.has(area.id),
    );
  const areaShapesVisible = showAreaShapes && canToggleAreaShapes;

  return (
    <>
      <FloorPlanTabs
        activeFloorId={activeFloor.id}
        floorPlans={floorPlans}
        onSelectFloor={onSelectFloor}
      />

      <ScrollView
        className="-mx-6 mt-4 flex-1"
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 80,
          paddingHorizontal: 24,
        }}
        refreshControl={
          <RefreshControl
            colors={["#8A77F4"]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor="#8A77F4"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <FloorPlanPreview
          floor={activeFloor}
          hiddenAreaIds={hiddenAreaIds}
          onPickImage={onPickImage}
          showAreaShapes={areaShapesVisible}
        />

        <FloorPlanActionsCard
          canToggleAreaShapes={canToggleAreaShapes}
          floor={activeFloor}
          onDelete={() => onDeleteFloor(activeFloor)}
          onPickImage={onPickImage}
          onRename={() => onRenameFloor(activeFloor)}
          onToggleAreaShapes={() => setShowAreaShapes((current) => !current)}
          rooms={rooms}
          showAreaShapes={areaShapesVisible}
        />

        <TouchableOpacity
          accessibilityLabel={`Manage areas for ${activeFloor.name}`}
          accessibilityRole="button"
          activeOpacity={0.82}
          className="min-h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5"
          onPress={() => onManageAreas(activeFloor)}
        >
          <MaterialCommunityIcons
            name="vector-polygon"
            color="#FFFFFF"
            size={19}
          />
          <Text className="font-ralewayBold text-sm text-white">
            Manage Areas
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            color="#FFFFFF"
            size={19}
          />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
