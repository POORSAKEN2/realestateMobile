import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { FloorAreaCard } from "./FloorAreaCard";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { FloorPlanIconButton } from "./FloorPlanIconButton";
import type {
  FloorArea,
  FloorPlan,
  FloorPlanDrawingMode,
  FloorPlanPoint,
  PropertyRoom,
} from "../../types";
import { getFloorAreaColor } from "../../utils/floorplans/floorPlanAreaColors";
import { getFloorRoomCount } from "../../utils/floorplans/floorPlanPresentation";

export function FloorPlanWorkspace({
  activeFloor,
  drawingArea,
  drawingMode,
  floorPlans,
  hiddenAreaIds,
  isShapeSaving,
  onAddArea,
  onCancelDrawing,
  onDeleteArea,
  onDeleteFloor,
  onDrawArea,
  onManageRooms,
  onPickImage,
  onRenameArea,
  onRenameFloor,
  onSaveShape,
  onSelectFloor,
  onToggleAreaVisibility,
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
  onAddArea: () => void;
  onCancelDrawing: () => void;
  onDeleteArea: (area: FloorArea) => void;
  onDeleteFloor: (floor: FloorPlan) => void;
  onDrawArea: (areaId: string, mode: FloorPlanDrawingMode) => void;
  onManageRooms: (area: FloorArea) => void;
  onPickImage: () => void;
  onRenameArea: (area: FloorArea) => void;
  onRenameFloor: (floor: FloorPlan) => void;
  onSaveShape: (points: FloorPlanPoint[]) => void;
  onSelectFloor: (id: string) => void;
  onToggleAreaVisibility: (areaId: string) => void;
  roomGuidance?: string;
  rooms: PropertyRoom[];
  showRoomActions: boolean;
}) {
  const contentScrollRef = useRef<ScrollView>(null);
  const [zoomedAreaId, setZoomedAreaId] = useState<string | null>(null);

  useEffect(() => {
    setZoomedAreaId(null);
  }, [activeFloor.id]);

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
      <ScrollView
        className="-mx-6 mt-4 max-h-12"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {floorPlans.map((floor) => (
          <TouchableOpacity
            accessibilityState={{ selected: floor.id === activeFloor.id }}
            className={`h-11 flex-row items-center gap-2 rounded-2xl px-4 ${
              floor.id === activeFloor.id
                ? "bg-primary"
                : "border border-slate-200 bg-white"
            }`}
            key={floor.id}
            onPress={() => onSelectFloor(floor.id)}
          >
            <MaterialCommunityIcons
              name="layers-outline"
              color={floor.id === activeFloor.id ? "#FFFFFF" : "#64748B"}
              size={17}
            />
            <Text
              className={`font-ralewayBold text-xs ${
                floor.id === activeFloor.id ? "text-white" : "text-slate-700"
              }`}
            >
              {floor.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="-mx-6 mt-4 flex-1"
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 130,
          paddingHorizontal: 24,
        }}
        ref={contentScrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayBold text-base text-textPrimary">
              {activeFloor.name}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {activeFloor.areas.length} areas ·{" "}
              {getFloorRoomCount(activeFloor, rooms)} rooms
            </Text>
          </View>
          <View className="flex-row gap-1">
            <FloorPlanIconButton
              icon="image-outline"
              label={
                activeFloor.image
                  ? "Change floor plan image"
                  : "Upload floor plan image"
              }
              onPress={onPickImage}
            />
            <FloorPlanIconButton
              icon="pencil-outline"
              label="Rename floor"
              onPress={() => onRenameFloor(activeFloor)}
            />
            <FloorPlanIconButton
              danger
              icon="trash-can-outline"
              label="Delete floor"
              onPress={() => onDeleteFloor(activeFloor)}
            />
          </View>
        </View>

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

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-ralewayBold text-lg text-textPrimary">
              Floor areas
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              {activeFloor.image
                ? "One saved shape per area."
                : "Upload this floor's plan image before mapping areas."}
            </Text>
          </View>
          <TouchableOpacity
            className="h-11 flex-row items-center gap-1.5 rounded-2xl bg-secondary/10 px-4"
            onPress={onAddArea}
          >
            <Feather name="plus" color="#634CE4" size={17} />
            <Text className="font-ralewayBold text-xs text-primary">
              Add Area
            </Text>
          </TouchableOpacity>
        </View>

        {roomGuidance ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-secondary/20 bg-secondary/10 p-3">
            <MaterialCommunityIcons
              name="information-outline"
              color="#634CE4"
              size={18}
            />
            <Text className="min-w-0 flex-1 text-xs leading-5 text-slate-600">
              {roomGuidance}
            </Text>
          </View>
        ) : null}

        {activeFloor.areas.length ? (
          activeFloor.areas.map((area, index) => (
            <FloorAreaCard
              area={area}
              canDraw={Boolean(activeFloor.image)}
              color={getFloorAreaColor(index)}
              hidden={hiddenAreaIds.has(area.id)}
              key={area.id}
              onDelete={() => onDeleteArea(area)}
              onDraw={(mode) => startAreaDrawing(area.id, mode)}
              onManageRooms={
                showRoomActions ? () => onManageRooms(area) : undefined
              }
              onRename={() => onRenameArea(area)}
              onToggleVisibility={() => toggleAreaVisibility(area)}
              onToggleZoom={() => toggleAreaZoom(area)}
              roomCount={rooms.filter((room) => room.areaId === area.id).length}
              zoomed={zoomedAreaId === area.id}
            />
          ))
        ) : (
          <View className="items-center rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-8">
            <MaterialCommunityIcons
              name="vector-polygon"
              color="#94A3B8"
              size={30}
            />
            <Text className="mt-3 font-ralewayBold text-sm text-slate-700">
              No areas identified
            </Text>
            <Text className="mt-1 text-center text-xs text-slate-500">
              Add area, then draw rectangle or polygon on plan.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
