import Feather from "@expo/vector-icons/Feather";
import { Text, TouchableOpacity, View } from "react-native";

import { SkeletonBlock } from "../ui/Skeleton";
import type { FloorPlan, PropertyRoom } from "../../types";
import type { FloorManagerPolicy } from "../../utils/properties/floorManagerPolicy";

export function PropertyFloorSummary({
  floorPlans,
  isLoading,
  onManage,
  policy,
  rooms,
}: {
  floorPlans: FloorPlan[];
  isLoading: boolean;
  onManage: () => void;
  policy: FloorManagerPolicy;
  rooms: PropertyRoom[];
}) {
  if (!policy.showFloorSummary) return null;

  const totalAreas = floorPlans.reduce(
    (total, floor) => total + floor.areas.length,
    0,
  );

  return (
    <View className="mt-6 border-t border-primary/20 pt-5">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-xs uppercase text-description">
            {policy.floorSummaryProminence === "primary"
              ? "Floor Summary"
              : "Optional Layout"}
          </Text>
          <Text className="mt-1 text-xs text-description">
            {policy.floorSummaryProminence === "secondary" && !floorPlans.length
              ? "Usually not needed for this property type"
              : `${floorPlans.length} ${
                  floorPlans.length === 1 ? "floor" : "floors"
                } · ${totalAreas} areas`}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Manage property floor plans"
          accessibilityRole="button"
          activeOpacity={0.8}
          className="h-10 flex-row items-center gap-1.5 rounded-xl bg-primary/10 px-3"
          onPress={onManage}
        >
          <Feather name="grid" color="#8A77F4" size={15} />
          <Text className="font-ralewayBold text-[10px] text-secondary">
            {policy.floorSummaryProminence === "primary"
              ? "Manage"
              : "Add anyway"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-3 gap-2">
        {isLoading ? (
          <View className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl bg-primary/10" />
            <View className="min-w-0 flex-1 gap-2">
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-1/2" />
            </View>
            <View className="items-end gap-2">
              <SkeletonBlock className="h-2.5 w-12" />
              <SkeletonBlock className="h-2.5 w-14 bg-primary/15" />
            </View>
          </View>
        ) : floorPlans.length ? (
          floorPlans.map((floor) => {
            const areaIds = new Set(floor.areas.map((area) => area.id));
            const floorRooms = rooms.filter(
              (room) =>
                room.floor === floor.name ||
                (room.areaId ? areaIds.has(room.areaId) : false),
            );
            const occupied = floorRooms.filter(
              (room) => room.status === "Occupied",
            ).length;
            const vacant = floorRooms.filter(
              (room) => room.status === "Vacant",
            ).length;
            const bedspaceCount = floorRooms.reduce(
              (total, room) => total + room.bedspaceCount,
              0,
            );

            return (
              <View
                className="rounded-2xl border border-primary/20 bg-primary/10 p-3"
                key={floor.id}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Feather name="layers" color="#8A77F4" size={17} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-ralewayBold text-sm text-textPrimary"
                      numberOfLines={1}
                    >
                      {floor.name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-description">
                      {floor.areas.length}{" "}
                      {floor.areas.length === 1 ? "area" : "areas"} ·{" "}
                      {floorRooms.length} rooms
                      {bedspaceCount > 0 ? ` · ${bedspaceCount} bedspaces` : ""}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-ralewayBold text-[9px] text-success">
                      {vacant} vacant
                    </Text>
                    <Text className="mt-1 font-ralewayBold text-[9px] text-secondary">
                      {occupied} occupied
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            className="items-center rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-5"
            onPress={onManage}
          >
            <Text className="font-ralewayBold text-xs text-description">
              {policy.floorSummaryProminence === "primary"
                ? "No floors yet. Add first floor plan."
                : "Floor plan optional. Add one when a visual layout helps."}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
