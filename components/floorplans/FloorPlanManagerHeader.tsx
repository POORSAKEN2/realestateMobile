import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function FloorPlanManagerHeader({
  canAddFloor,
  floorCount,
  guidance,
  notice,
  onAddFloor,
  onBack,
  onClearNotice,
  propertyTitle,
  roomCount,
  showRoomSummary,
  totalAreas,
}: {
  canAddFloor: boolean;
  floorCount: number;
  guidance: string;
  notice: string;
  onAddFloor: () => void;
  onBack: () => void;
  onClearNotice: () => void;
  propertyTitle: string;
  roomCount: number;
  showRoomSummary: boolean;
  totalAreas: number;
}) {
  return (
    <>
      <ModuleHeader
        action={
          <TouchableOpacity
            accessibilityLabel="Add floor"
            accessibilityRole="button"
            className={`h-11 flex-row items-center gap-1.5 rounded-2xl px-3.5 ${
              canAddFloor ? "bg-primary" : "bg-slate-200"
            }`}
            disabled={!canAddFloor}
            onPress={onAddFloor}
          >
            <Feather
              name="plus"
              color={canAddFloor ? "#FFFFFF" : "#94A3B8"}
              size={17}
            />
            <Text
              className={`font-ralewayBold text-xs ${
                canAddFloor ? "text-white" : "text-slate-400"
              }`}
            >
              Floor
            </Text>
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
        {showRoomSummary ? (
          <SummaryPill
            icon="door"
            label={`${roomCount} ${roomCount === 1 ? "room" : "rooms"}`}
          />
        ) : null}
      </View>

      <Text className="mt-2 px-1 text-xs leading-5 text-slate-500">
        {guidance}
      </Text>

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
      <MaterialCommunityIcons name={icon} color="#8A77F4" size={15} />
      <Text
        className="font-ralewayBold text-[10px] text-slate-700"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
