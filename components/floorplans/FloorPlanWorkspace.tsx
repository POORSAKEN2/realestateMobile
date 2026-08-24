import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FloorAreaCard } from "./FloorAreaCard";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { FloorPlanIconButton } from "./FloorPlanIconButton";
import { DropdownField } from "../ui/fields/DropdownField";
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
  onRefresh,
  onSaveShape,
  onSelectFloor,
  onToggleAreaVisibility,
  roomGuidance,
  rooms,
  showRoomActions,
  refreshing,
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
  onRefresh: () => void;
  onSaveShape: (points: FloorPlanPoint[]) => void;
  onSelectFloor: (id: string) => void;
  onToggleAreaVisibility: (areaId: string) => void;
  roomGuidance?: string;
  rooms: PropertyRoom[];
  showRoomActions: boolean;
  refreshing: boolean;
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

      <View className="mt-4">
        <View className="mb-2 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Floor area
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500">
              Select an area to view and manage it.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Add floor area"
            accessibilityRole="button"
            className="h-11 flex-row items-center gap-1.5 rounded-2xl bg-primary/10 px-4"
            onPress={onAddArea}
          >
            <Feather name="plus" color="#8A77F4" size={17} />
            <Text className="font-ralewayBold text-xs text-primary">
              Add Area
            </Text>
          </TouchableOpacity>
        </View>
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
        />
      </View>

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

        {roomGuidance ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3">
            <MaterialCommunityIcons
              name="information-outline"
              color="#8A77F4"
              size={18}
            />
            <Text className="min-w-0 flex-1 text-xs leading-5 text-slate-600">
              {roomGuidance}
            </Text>
          </View>
        ) : null}

        {selectedArea ? (
          <FloorAreaCard
            area={selectedArea}
            canDraw={Boolean(activeFloor.image)}
            color={getFloorAreaColor(selectedAreaIndex)}
            hidden={hiddenAreaIds.has(selectedArea.id)}
            onDelete={() => onDeleteArea(selectedArea)}
            onDraw={(mode) => startAreaDrawing(selectedArea.id, mode)}
            onManageRooms={
              showRoomActions ? () => onManageRooms(selectedArea) : undefined
            }
            onRename={() => onRenameArea(selectedArea)}
            onToggleVisibility={() => toggleAreaVisibility(selectedArea)}
            onToggleZoom={() => toggleAreaZoom(selectedArea)}
            roomCount={
              rooms.filter((room) => room.areaId === selectedArea.id).length
            }
            zoomed={zoomedAreaId === selectedArea.id}
          />
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
              Add an area, then select it here to map and manage it.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
