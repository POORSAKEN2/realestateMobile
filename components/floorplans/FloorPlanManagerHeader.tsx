import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function FloorPlanManagerHeader({
  floorCount,
  notice,
  onAddFloor,
  onBack,
  onClearNotice,
  propertyTitle,
  roomCount,
  totalAreas,
}: {
  floorCount: number;
  notice: string;
  onAddFloor: () => void;
  onBack: () => void;
  onClearNotice: () => void;
  propertyTitle: string;
  roomCount: number;
  totalAreas: number;
}) {
  return (
    <>
      <ModuleHeader
        action={
          <TouchableOpacity
            accessibilityLabel="Add floor"
            accessibilityRole="button"
            className="h-11 flex-row items-center gap-1.5 rounded-2xl bg-primary px-3.5"
            onPress={onAddFloor}
          >
            <Feather name="plus" color="#FFFFFF" size={17} />
            <Text className="font-ralewayBold text-xs text-white">Floor</Text>
          </TouchableOpacity>
        }
        eyebrow="Property Layout"
        leading={
          <BackButton
            accessibilityLabel="Back to properties"
            onPress={onBack}
            variant="secondary"
          />
        }
        supportingText={propertyTitle}
        title="Floor Plans"
      />

      <View className="mt-4 flex-row gap-2">
        <SummaryPill
          icon="layers-outline"
          label={`${floorCount} ${floorCount === 1 ? "floor" : "floors"}`}
        />
        <SummaryPill
          icon="vector-polygon"
          label={`${totalAreas} ${totalAreas === 1 ? "area" : "areas"}`}
        />
        <SummaryPill
          icon="door"
          label={`${roomCount} ${roomCount === 1 ? "room" : "rooms"}`}
        />
      </View>

      {notice ? (
        <TouchableOpacity
          activeOpacity={0.8}
          className="mt-3 flex-row items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3"
          onPress={onClearNotice}
        >
          <Feather name="check-circle" color="#0D9488" size={16} />
          <Text className="min-w-0 flex-1 font-ralewayBold text-xs text-teal-800">
            {notice}
          </Text>
          <Feather name="x" color="#0D9488" size={15} />
        </TouchableOpacity>
      ) : null}
    </>
  );
}

function SummaryPill({
  icon,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5">
      <MaterialCommunityIcons name={icon} color="#634CE4" size={15} />
      <Text
        className="font-ralewayBold text-[10px] text-slate-700"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
