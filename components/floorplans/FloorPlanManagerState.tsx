import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
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
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#634CE4" size="large" />
      <Text className="mt-3 text-sm text-slate-500">
        Loading floor plans...
      </Text>
    </View>
  );
}

export function FloorPlanErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Feather name="cloud-off" color="#64748B" size={30} />
      <Text className="mt-3 font-ralewayBold text-lg text-textPrimary">
        Floor plans unavailable
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
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-secondary/20">
        <MaterialCommunityIcons name="layers-plus" color="#634CE4" size={36} />
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
