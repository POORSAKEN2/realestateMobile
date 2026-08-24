import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { FloorAreaCard } from "./FloorAreaCard";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { FloorPlanTabs } from "./FloorPlanTabs";
import { DropdownField } from "../ui/fields/DropdownField";
import type {
  FloorArea,
  FloorPlan,
  FloorPlanDrawingMode,
  FloorPlanPoint,
  PropertyRoom,
} from "../../types";
import { getFloorAreaColor } from "../../utils/floorplans/floorPlanAreaColors";

export function FloorAreaWorkspace({
  activeFloor,
  drawingArea,
  drawingMode,
  floorPlans,
  hiddenAreaIds,
  isShapeSaving,
  onCancelDrawing,
  onDeleteArea,
  onDrawArea,
  onManageRooms,
  onRefresh,
  onRenameArea,
  onSaveShape,
  onSelectFloor,
  onToggleAreaVisibility,
  refreshing,
  roomGuidance,
  rooms,
  showRoomActions,
}: {
  activeFloor: FloorPlan;
  drawingArea: FloorArea | null;
  drawingMode: FloorPlanDrawingMode | null;
  floorPlans: FloorPlan[];
  hiddenAreaIds: Set<string>;
  isShapeSaving: boolean;
  onCancelDrawing: () => void;
  onDeleteArea: (area: FloorArea) => void;
  onDrawArea: (areaId: string, mode: FloorPlanDrawingMode) => void;
  onManageRooms: (area: FloorArea) => void;
  onRefresh: () => void;
  onRenameArea: (area: FloorArea) => void;
  onSaveShape: (points: FloorPlanPoint[]) => void;
  onSelectFloor: (id: string) => void;
  onToggleAreaVisibility: (areaId: string) => void;
  refreshing: boolean;
  roomGuidance?: string;
  rooms: PropertyRoom[];
  showRoomActions: boolean;
}) {
  const contentScrollRef = useRef<ScrollView>(null);
  const [selectedAreaId, setSelectedAreaId] = useState(
    activeFloor.areas[0]?.id ?? "",
  );
  const [zoomedAreaId, setZoomedAreaId] = useState<string | null>(null);

  useEffect(() => {
    setZoomedAreaId(null);
  }, [activeFloor.id]);

  useEffect(() => {
    setSelectedAreaId((current) =>
      activeFloor.areas.some((area) => area.id === current)
        ? current
        : (activeFloor.areas[0]?.id ?? ""),
    );
  }, [activeFloor.areas, activeFloor.id]);

  useEffect(() => {
    if (
      zoomedAreaId &&
      !activeFloor.areas.some(
        (area) => area.id === zoomedAreaId && area.points.length >= 3,
      )
    ) {
      setZoomedAreaId(null);
    }
  }, [activeFloor.areas, zoomedAreaId]);

  const selectedArea =
    activeFloor.areas.find((area) => area.id === selectedAreaId) ??
    activeFloor.areas[0] ??
    null;
  const selectedAreaIndex = selectedArea
    ? activeFloor.areas.findIndex((area) => area.id === selectedArea.id)
    : -1;
  const areaOptions = activeFloor.areas.map((area) => {
    const roomCount = rooms.filter((room) => room.areaId === area.id).length;

    return {
      label: `${area.label} · ${roomCount} ${roomCount === 1 ? "room" : "rooms"}`,
      value: area.id,
    };
  });

  function toggleAreaZoom(area: FloorArea) {
    const shouldZoomIn = zoomedAreaId !== area.id;
    setZoomedAreaId(shouldZoomIn ? area.id : null);

    if (shouldZoomIn) {
      requestAnimationFrame(() => {
        contentScrollRef.current?.scrollTo({ animated: true, y: 0 });
      });
    }
  }

  function startAreaDrawing(areaId: string, mode: FloorPlanDrawingMode) {
    setZoomedAreaId(null);
    onDrawArea(areaId, mode);
  }

  function toggleAreaVisibility(area: FloorArea) {
    if (!hiddenAreaIds.has(area.id) && zoomedAreaId === area.id) {
      setZoomedAreaId(null);
    }
    onToggleAreaVisibility(area.id);
  }

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
          paddingBottom: 130,
          paddingHorizontal: 24,
        }}
        ref={contentScrollRef}
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
        <FloorPlanCanvas
          areas={activeFloor.areas}
          drawingArea={drawingArea}
          drawingMode={drawingMode}
          focusedAreaId={zoomedAreaId}
          hiddenAreaIds={hiddenAreaIds}
          image={activeFloor.image}
          isSaving={isShapeSaving}
          onCancelDrawing={onCancelDrawing}
          onSaveShape={onSaveShape}
        />

        <View>
          <Text className="font-ralewayBold text-sm text-textPrimary">
            Area selection
          </Text>
          <Text className="mt-0.5 text-xs text-description">
            Choose an area from {activeFloor.name} to view and manage it.
          </Text>
          <DropdownField
            disabled={areaOptions.length === 0}
            dynamicSheetHeight
            label="floor area"
            onSelect={setSelectedAreaId}
            options={areaOptions}
            placeholder="No floor areas"
            sheetBottomInsetMode="safe-area"
            subtitle={`Choose an area from ${activeFloor.name}.`}
            value={selectedArea?.id ?? ""}
            variant="compact"
            wrapperClassName="mt-2"
          />
        </View>

        {roomGuidance ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3">
            <MaterialCommunityIcons
              name="information-outline"
              color="#8A77F4"
              size={18}
            />
            <Text className="min-w-0 flex-1 text-xs leading-5 text-description">
              {roomGuidance}
            </Text>
          </View>
        ) : null}

        {selectedArea ? (
          <View>
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Area actions
            </Text>
            <View className="mt-2">
              <FloorAreaCard
                area={selectedArea}
                canDraw={Boolean(activeFloor.image)}
                color={getFloorAreaColor(selectedAreaIndex)}
                hidden={hiddenAreaIds.has(selectedArea.id)}
                onDelete={() => onDeleteArea(selectedArea)}
                onDraw={(mode) => startAreaDrawing(selectedArea.id, mode)}
                onManageRooms={
                  showRoomActions
                    ? () => onManageRooms(selectedArea)
                    : undefined
                }
                onRename={() => onRenameArea(selectedArea)}
                onToggleVisibility={() => toggleAreaVisibility(selectedArea)}
                onToggleZoom={() => toggleAreaZoom(selectedArea)}
                roomCount={
                  rooms.filter((room) => room.areaId === selectedArea.id).length
                }
                zoomed={zoomedAreaId === selectedArea.id}
              />
            </View>
          </View>
        ) : (
          <View className="items-center rounded-[24px] border border-dashed border-primary/20 bg-white px-6 py-8">
            <MaterialCommunityIcons
              name="vector-polygon"
              color="#8A77F4"
              size={30}
            />
            <Text className="mt-3 font-ralewayBold text-sm text-textPrimary">
              No areas identified
            </Text>
            <Text className="mt-1 text-center text-xs text-description">
              Use Add Area to create the first area for this floor.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
