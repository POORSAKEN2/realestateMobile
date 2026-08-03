import { useState } from "react";
import { Text, View } from "react-native";

import {
  FloorAreaActionSheet,
  type FloorAreaActionView,
} from "./FloorAreaActionSheet";
import { FloorAreaCardActions } from "./FloorAreaCardActions";
import { FloorPlanIconButton } from "./FloorPlanIconButton";
import type { FloorArea, FloorPlanDrawingMode } from "../../types";

export function FloorAreaCard({
  area,
  canDraw,
  hidden,
  onDelete,
  onDraw,
  onManageRooms,
  onRename,
  onToggleVisibility,
  roomCount,
}: {
  area: FloorArea;
  canDraw: boolean;
  hidden: boolean;
  onDelete: () => void;
  onDraw: (mode: FloorPlanDrawingMode) => void;
  onManageRooms?: () => void;
  onRename: () => void;
  onToggleVisibility: () => void;
  roomCount: number;
}) {
  const [activeSheet, setActiveSheet] = useState<FloorAreaActionView | null>(
    null,
  );
  const hasShape = area.points.length >= 3;

  return (
    <>
      <View className="rounded-[24px] border border-slate-200 bg-white p-4">
        <View className="flex-row items-start gap-3">
          <View className="mt-1 h-4 w-4 rounded-full border-[3px] border-primary bg-secondary/30" />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="min-w-0 flex-1 font-ralewayBold text-base text-textPrimary"
                numberOfLines={1}
              >
                {area.label}
              </Text>
              <View
                className={`rounded-full px-2 py-1 ${
                  hasShape ? "bg-teal-50" : "bg-amber-50"
                }`}
              >
                <Text
                  className={`font-ralewayBold text-[9px] uppercase ${
                    hasShape ? "text-teal-700" : "text-amber-700"
                  }`}
                >
                  {hasShape ? "Mapped" : "Unmapped"}
                </Text>
              </View>
            </View>
            <Text className="mt-1 text-xs text-slate-500">
              {onManageRooms
                ? `${roomCount} ${roomCount === 1 ? "room" : "rooms"} · `
                : ""}
              {hasShape
                ? hidden
                  ? "Shape hidden"
                  : "Shape visible"
                : "No shape yet"}
            </Text>
          </View>
          <View className="flex-row gap-1">
            {hasShape ? (
              <FloorPlanIconButton
                icon={hidden ? "eye-off-outline" : "eye-outline"}
                label={hidden ? "Show area shape" : "Hide area shape"}
                onPress={onToggleVisibility}
              />
            ) : null}
            <FloorPlanIconButton
              icon="dots-horizontal"
              label={`More actions for ${area.label}`}
              onPress={() => setActiveSheet("actions")}
            />
          </View>
        </View>

        <FloorAreaCardActions
          canDraw={canDraw}
          hasShape={hasShape}
          onChooseShape={() => setActiveSheet("shape")}
          onManageRooms={onManageRooms}
        />
      </View>

      <FloorAreaActionSheet
        onClose={() => setActiveSheet(null)}
        onDelete={onDelete}
        onDraw={onDraw}
        onRename={onRename}
        view={activeSheet}
      />
    </>
  );
}
