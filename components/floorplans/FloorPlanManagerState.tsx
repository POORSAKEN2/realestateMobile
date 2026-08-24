import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";
import type { FloorManagerMode } from "../../utils/properties/floorManagerPolicy";

export function MissingPropertyState({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="font-ralewayBold text-lg text-textPrimary">
        Property unavailable
      </Text>
      <TouchableOpacity
        className="mt-4 rounded-xl bg-primary px-5 py-3"
        onPress={onBack}
      >
        <Text className="font-ralewayBold text-white">Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FloorPlanLoadingState() {
  return (
    <SkeletonGroup
      accessibilityLabel="Loading floor plans"
      className="mt-4 flex-1"
    >
      <FloorTabsSkeleton />
      <FloorImageSkeleton />
      <FloorActionsSkeleton />
      <SkeletonBlock className="mt-4 h-14 w-full rounded-2xl bg-primary/20" />
    </SkeletonGroup>
  );
}

export function FloorAreaLoadingState() {
  return (
    <SkeletonGroup
      accessibilityLabel="Loading floor areas"
      className="mt-4 flex-1"
    >
      <FloorTabsSkeleton />
      <FloorImageSkeleton />

      <View className="mt-4 gap-2">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-3 w-48 max-w-full" />
        <SkeletonBlock className="h-14 w-full rounded-2xl" />
      </View>

      <View className="mt-4 rounded-[24px] border border-primary/20 bg-white p-4">
        <View className="flex-row items-center gap-3">
          <SkeletonBlock className="h-4 w-4 rounded-full bg-primary/20" />
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-32" />
          </View>
          <SkeletonBlock className="h-10 w-10 rounded-xl bg-primary/10" />
        </View>
        <SkeletonBlock className="mt-4 h-12 w-full rounded-xl bg-primary/20" />
      </View>
    </SkeletonGroup>
  );
}

function FloorTabsSkeleton() {
  return (
    <View className="flex-row gap-2">
      <SkeletonBlock className="h-11 w-24 rounded-2xl bg-primary/20" />
      <SkeletonBlock className="h-11 w-24 rounded-2xl" />
    </View>
  );
}

function FloorImageSkeleton() {
  return (
    <View className="mt-4 overflow-hidden rounded-[24px] border border-primary/20 bg-white p-3">
      <SkeletonBlock className="h-52 w-full rounded-2xl bg-primary/10" />
      <View className="mt-3 flex-row items-center justify-center gap-2">
        <SkeletonBlock className="h-2.5 w-2.5 rounded-full bg-primary/20" />
        <SkeletonBlock className="h-3 w-48 max-w-full" />
      </View>
    </View>
  );
}

function FloorActionsSkeleton() {
  return (
    <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-primary/20 bg-white p-3">
      <View className="min-w-0 flex-1 gap-2">
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-3 w-20" />
      </View>
      <View className="flex-row gap-1">
        {Array.from({ length: 3 }, (_, index) => (
          <SkeletonBlock
            className="h-10 w-10 rounded-xl bg-primary/10"
            key={index}
          />
        ))}
      </View>
    </View>
  );
}

export function MissingFloorState({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons
        name="layers-off-outline"
        color="#8A77F4"
        size={34}
      />
      <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
        Floor unavailable
      </Text>
      <Text className="mt-1 text-center text-sm text-description">
        Return to Floor Plans and choose an available floor.
      </Text>
      <TouchableOpacity
        className="mt-4 rounded-xl bg-primary px-5 py-3"
        onPress={onBack}
      >
        <Text className="font-ralewayBold text-white">Back to floor plans</Text>
      </TouchableOpacity>
    </View>
  );
}

export function FloorPlanErrorState({
  onRetry,
  title = "Floor plans unavailable",
}: {
  onRetry: () => void;
  title?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Feather name="cloud-off" color="#64748B" size={30} />
      <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm text-slate-500">
        Check connection and try again.
      </Text>
      <TouchableOpacity
        className="mt-4 rounded-xl bg-primary px-5 py-3"
        onPress={onRetry}
      >
        <Text className="font-ralewayBold text-white">Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export function EmptyFloorPlanState({
  canCreate,
  mode,
  onCreate,
}: {
  canCreate: boolean;
  mode: FloorManagerMode;
  onCreate: () => void;
}) {
  const isMinimal = mode === "minimal";

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10">
        <MaterialCommunityIcons name="layers-plus" color="#8A77F4" size={36} />
      </View>
      <Text className="mt-5 text-center font-ralewayBold text-xl text-textPrimary">
        {canCreate
          ? isMinimal
            ? "Floor plan optional"
            : "Add first floor"
          : "Floor plans unavailable"}
      </Text>
      <Text className="mt-2 text-center text-sm leading-6 text-slate-500">
        {canCreate
          ? isMinimal
            ? "This property usually needs no mapped layout. Add one when a visual plan still helps."
            : mode === "full"
              ? "Create a floor, upload its plan, map areas, then connect rooms."
              : "Create a floor, upload its plan, and map the internal layout."
          : "Current property settings do not support new floor plans."}
      </Text>
      {canCreate ? (
        <TouchableOpacity
          className="mt-5 h-12 items-center justify-center rounded-2xl bg-primary px-6"
          onPress={onCreate}
        >
          <Text className="font-ralewayBold text-white">
            {isMinimal ? "Add layout anyway" : "Create Floor 1"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
