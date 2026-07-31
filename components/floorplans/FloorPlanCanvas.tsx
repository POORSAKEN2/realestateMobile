import Feather from "@expo/vector-icons/Feather";
import { useEffect, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Polygon, Polyline } from "react-native-svg";

import type {
  FloorArea,
  FloorPlanDrawingMode,
  FloorPlanPoint,
} from "../../types";
import { FLOOR_PLAN_SHAPE_STRATEGIES } from "../../utils/floorplans/floorPlanShapes";

const AREA_COLORS = [
  "#634CE4",
  "#0D9488",
  "#E11D48",
  "#D97706",
  "#2563EB",
  "#7C3AED",
];

function pointList(points: FloorPlanPoint[], width: number, height: number) {
  return points
    .map((point) => `${point.x * width},${point.y * height}`)
    .join(" ");
}

export function FloorPlanCanvas({
  areas,
  drawingArea,
  drawingMode,
  hiddenAreaIds,
  image,
  isSaving,
  onCancelDrawing,
  onSaveShape,
}: {
  areas: FloorArea[];
  drawingArea: FloorArea | null;
  drawingMode: FloorPlanDrawingMode | null;
  hiddenAreaIds: Set<string>;
  image?: string;
  isSaving: boolean;
  onCancelDrawing: () => void;
  onSaveShape: (points: FloorPlanPoint[]) => void;
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

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setCanvas({ width, height });
  }

  function handlePress(event: GestureResponderEvent) {
    if (!drawingArea || !drawingMode || !canvas.width || !canvas.height) return;

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
    <View className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-200">
      <Pressable
        accessibilityLabel={
          drawingMode
            ? `Draw ${drawingMode} for ${drawingArea?.label ?? "area"}`
            : "Floor plan preview"
        }
        className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100"
        onLayout={handleLayout}
        onPress={handlePress}
      >
        {image ? (
          <Image
            className="h-full w-full"
            resizeMode="contain"
            source={{ uri: image }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <Feather name="image" color="#634CE4" size={24} />
            </View>
            <Text className="mt-3 text-center font-ralewayBold text-sm text-slate-700">
              Add floor plan image
            </Text>
            <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
              Shapes can still be drawn without image.
            </Text>
          </View>
        )}

        {canvas.width && canvas.height ? (
          <Svg
            height={canvas.height}
            pointerEvents="none"
            style={{ left: 0, position: "absolute", top: 0 }}
            width={canvas.width}
          >
            {areas.map((area, index) => {
              if (
                hiddenAreaIds.has(area.id) ||
                area.points.length < 3 ||
                area.id === drawingArea?.id
              ) {
                return null;
              }
              const color = AREA_COLORS[index % AREA_COLORS.length];

              return (
                <Polygon
                  fill={color}
                  fillOpacity={0.28}
                  key={area.id}
                  points={pointList(area.points, canvas.width, canvas.height)}
                  stroke={color}
                  strokeWidth={2.5}
                />
              );
            })}

            {drawingArea && displayedDraftPoints.length ? (
              <>
                {displayedDraftPoints.length >= 3 ? (
                  <Polygon
                    fill="#634CE4"
                    fillOpacity={0.26}
                    points={pointList(
                      displayedDraftPoints,
                      canvas.width,
                      canvas.height,
                    )}
                    stroke="#634CE4"
                    strokeDasharray="7 5"
                    strokeWidth={3}
                  />
                ) : (
                  <Polyline
                    fill="none"
                    points={pointList(
                      displayedDraftPoints,
                      canvas.width,
                      canvas.height,
                    )}
                    stroke="#634CE4"
                    strokeDasharray="7 5"
                    strokeWidth={3}
                  />
                )}
                {draftPoints.map((point, index) => (
                  <Circle
                    cx={point.x * canvas.width}
                    cy={point.y * canvas.height}
                    fill="#FFFFFF"
                    key={`${point.x}:${point.y}:${index}`}
                    r={6}
                    stroke="#634CE4"
                    strokeWidth={3}
                  />
                ))}
              </>
            ) : null}
          </Svg>
        ) : null}
      </Pressable>

      {drawingArea && drawingMode ? (
        <View className="border-t border-slate-200 bg-white p-4">
          <Text className="font-ralewayBold text-sm text-textPrimary">
            {drawingStrategy?.instruction}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            Drawing {drawingArea.label}. Existing shape replaced after save.
          </Text>
          <View className="mt-3 flex-row gap-2">
            <TouchableOpacity
              className="h-11 flex-1 items-center justify-center rounded-xl border border-slate-200"
              disabled={isSaving}
              onPress={() => setDraftPoints([])}
            >
              <Text className="font-ralewayBold text-xs text-slate-700">
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
                canSave ? "bg-primary" : "bg-slate-200"
              }`}
              disabled={!canSave || isSaving}
              onPress={() => onSaveShape(displayedDraftPoints)}
            >
              <Text
                className={`font-ralewayBold text-xs ${
                  canSave ? "text-white" : "text-slate-400"
                }`}
              >
                {isSaving ? "Saving..." : "Save shape"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-3">
          <View className="h-2 w-2 rounded-full bg-teal-500" />
          <Text className="text-center text-xs text-slate-500">
            Area shapes use plan-relative coordinates.
          </Text>
        </View>
      )}
    </View>
  );
}
