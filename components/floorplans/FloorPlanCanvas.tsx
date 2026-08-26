import Feather from "@expo/vector-icons/Feather";
import { useEffect, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Image as SvgImage,
  Polygon,
  Polyline,
} from "react-native-svg";

import type {
  FloorArea,
  FloorPlanDrawingMode,
  FloorPlanPoint,
} from "../../types";
import { getFloorAreaColor } from "../../utils/floorplans/floorPlanAreaColors";
import { FLOOR_PLAN_SHAPE_STRATEGIES } from "../../utils/floorplans/floorPlanShapes";
import { createFloorPlanViewport } from "../../utils/floorplans/floorPlanViewport";

function pointList(points: FloorPlanPoint[], width: number, height: number) {
  return points
    .map((point) => `${point.x * width},${point.y * height}`)
    .join(" ");
}

export function FloorPlanCanvas({
  areas,
  drawingArea,
  drawingMode,
  focusedAreaId,
  hiddenAreaIds,
  image,
  isSaving,
  onCancelDrawing,
  onEmptyImagePress,
  onSaveShape,
  showAreaShapes = true,
  showShapeCaption = true,
}: {
  areas: FloorArea[];
  drawingArea: FloorArea | null;
  drawingMode: FloorPlanDrawingMode | null;
  focusedAreaId: string | null;
  hiddenAreaIds: Set<string>;
  image?: string;
  isSaving: boolean;
  onCancelDrawing: () => void;
  onEmptyImagePress?: () => void;
  onSaveShape: (points: FloorPlanPoint[]) => void;
  showAreaShapes?: boolean;
  showShapeCaption?: boolean;
}) {
  const [canvas, setCanvas] = useState({ width: 0, height: 0 });
  const [draftPoints, setDraftPoints] = useState<FloorPlanPoint[]>([]);
  const drawingStrategy = drawingMode
    ? FLOOR_PLAN_SHAPE_STRATEGIES[drawingMode]
    : null;

  useEffect(() => {
    setDraftPoints([]);
  }, [drawingArea?.id, drawingMode]);

  const displayedDraftPoints = useMemo(() => {
    return drawingStrategy?.displayPoints(draftPoints) ?? draftPoints;
  }, [draftPoints, drawingStrategy]);
  const focusedArea = useMemo(
    () => areas.find((area) => area.id === focusedAreaId) ?? null,
    [areas, focusedAreaId],
  );
  const viewport = useMemo(() => {
    if (drawingArea || !focusedArea || hiddenAreaIds.has(focusedArea.id)) {
      return createFloorPlanViewport([], canvas.width, canvas.height);
    }

    return createFloorPlanViewport(
      focusedArea.points,
      canvas.width,
      canvas.height,
    );
  }, [canvas.height, canvas.width, drawingArea, focusedArea, hiddenAreaIds]);
  const viewBox = `${viewport.x} ${viewport.y} ${viewport.width} ${viewport.height}`;

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setCanvas({ width, height });
  }

  function handlePress(event: GestureResponderEvent) {
    if (!image) {
      onEmptyImagePress?.();
      return;
    }

    if (!drawingArea || !drawingMode || !canvas.width || !canvas.height) {
      return;
    }

    const nextPoint = {
      x: Math.min(1, Math.max(0, event.nativeEvent.locationX / canvas.width)),
      y: Math.min(1, Math.max(0, event.nativeEvent.locationY / canvas.height)),
    };

    setDraftPoints((current) =>
      FLOOR_PLAN_SHAPE_STRATEGIES[drawingMode].addPoint(current, nextPoint),
    );
  }

  const canSave = drawingStrategy?.canSave(draftPoints) ?? false;

  return (
    <View className="overflow-hidden rounded-[28px] border border-textPrimary/10 bg-textPrimary/10">
      <Pressable
        accessibilityLabel={
          drawingMode
            ? `Draw ${drawingMode} for ${drawingArea?.label ?? "area"}`
            : !image && onEmptyImagePress
              ? "Choose floor plan image"
              : "Floor plan preview"
        }
        accessibilityRole={!image && onEmptyImagePress ? "button" : undefined}
        className="relative aspect-[4/3] w-full overflow-hidden bg-surface"
        onLayout={handleLayout}
        onPress={handlePress}
      >
        {!image ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <Feather name="image" color="#8A77F4" size={24} />
            </View>
            <Text className="mt-3 text-center font-ralewayBold text-sm text-textPrimary">
              Add floor plan image
            </Text>
            <Text className="mt-1 text-center text-xs leading-5 text-description">
              {onEmptyImagePress
                ? "Tap here to choose an image for this floor."
                : "Upload this floor's plan image before drawing area shapes."}
            </Text>
          </View>
        ) : null}

        {image && canvas.width && canvas.height ? (
          <Svg
            height={canvas.height}
            pointerEvents="none"
            style={{ left: 0, position: "absolute", top: 0 }}
            viewBox={viewBox}
            width={canvas.width}
          >
            <SvgImage
              height={canvas.height}
              href={{ uri: image }}
              preserveAspectRatio="xMidYMid meet"
              width={canvas.width}
              x={0}
              y={0}
            />

            {showAreaShapes
              ? areas.map((area, index) => {
                  if (
                    hiddenAreaIds.has(area.id) ||
                    area.points.length < 3 ||
                    area.id === drawingArea?.id
                  ) {
                    return null;
                  }
                  const color = getFloorAreaColor(index);

                  return (
                    <Polygon
                      fill={color}
                      fillOpacity={0.28}
                      key={area.id}
                      points={pointList(
                        area.points,
                        canvas.width,
                        canvas.height,
                      )}
                      stroke={color}
                      strokeWidth={2.5}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })
              : null}

            {drawingArea && displayedDraftPoints.length ? (
              <>
                {displayedDraftPoints.length >= 3 ? (
                  <Polygon
                    fill="#8A77F4"
                    fillOpacity={0.26}
                    points={pointList(
                      displayedDraftPoints,
                      canvas.width,
                      canvas.height,
                    )}
                    stroke="#8A77F4"
                    strokeDasharray="7 5"
                    strokeWidth={3}
                    vectorEffect="non-scaling-stroke"
                  />
                ) : (
                  <Polyline
                    fill="none"
                    points={pointList(
                      displayedDraftPoints,
                      canvas.width,
                      canvas.height,
                    )}
                    stroke="#8A77F4"
                    strokeDasharray="7 5"
                    strokeWidth={3}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {draftPoints.map((point, index) => (
                  <Circle
                    cx={point.x * canvas.width}
                    cy={point.y * canvas.height}
                    fill="#FFFFFF"
                    key={`${point.x}:${point.y}:${index}`}
                    r={6}
                    stroke="#8A77F4"
                    strokeWidth={3}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </>
            ) : null}
          </Svg>
        ) : null}
      </Pressable>

      {drawingArea && drawingMode ? (
        <View className="border-t border-textPrimary/10 bg-white p-4">
          <Text className="font-ralewayBold text-sm text-textPrimary">
            {drawingStrategy?.instruction}
          </Text>
          <Text className="mt-1 text-xs text-description">
            Drawing {drawingArea.label}. Existing shape replaced after save.
          </Text>
          <View className="mt-3 flex-row gap-2">
            <TouchableOpacity
              className="h-11 flex-1 items-center justify-center rounded-xl border border-textPrimary/10"
              disabled={isSaving}
              onPress={() => setDraftPoints([])}
            >
              <Text className="font-ralewayBold text-xs text-textPrimary">
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-11 flex-1 items-center justify-center rounded-xl border border-primary"
              disabled={isSaving}
              onPress={onCancelDrawing}
            >
              <Text className="font-ralewayBold text-xs text-primary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`h-11 flex-1 items-center justify-center rounded-xl ${
                canSave ? "bg-primary" : "bg-textPrimary/10"
              }`}
              disabled={!canSave || isSaving}
              onPress={() => onSaveShape(displayedDraftPoints)}
            >
              <Text
                className={`font-ralewayBold text-xs ${
                  canSave ? "text-white" : "text-description"
                }`}
              >
                {isSaving ? "Saving..." : "Save shape"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showShapeCaption ? (
        <View className="flex-row items-center justify-center gap-2 border-t border-textPrimary/10 bg-white px-4 py-3">
          <View className="h-2 w-2 rounded-full bg-success" />
          <Text className="text-center text-xs text-description">
            Area shapes use plan-relative coordinates.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
