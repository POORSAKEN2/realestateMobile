import { PermissionGate } from "../auth/PermissionGate";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { BackButton } from "../ui/buttons/BackButton";
import { ModuleHeader } from "../ui/ModuleHeader";

export function FloorPlanManagerHeader({
  canAddFloor,
  floorCount,
  guidance,
  onAddFloor,
  onBack,
  propertyTitle,
  roomCount,
  showRoomSummary,
  totalAreas,
}: {
  canAddFloor: boolean;
  floorCount: number;
  guidance: string;
  onAddFloor: () => void;
  onBack: () => void;
  propertyTitle: string;
  roomCount: number;
  showRoomSummary: boolean;
  totalAreas: number;
}) {
  return (
    <>
      <ModuleHeader
        action={
          <PermissionGate permission="floorplans.create"><TouchableOpacity
            accessibilityLabel="Add floor"
            accessibilityRole="button"
            className={`h-11 flex-row items-center gap-1.5 rounded-2xl px-3.5 ${
              canAddFloor ? "bg-primary" : "bg-textPrimary/10"
            }`}
            disabled={!canAddFloor}
            onPress={onAddFloor}
          >
            <Feather
              name="plus"
              color={canAddFloor ? "#FFFFFF" : "#6F6D6D"}
              size={17}
            />
            <Text
              className={`font-ralewayBold text-xs ${
                canAddFloor ? "text-white" : "text-description"
              }`}
            >
              Floor
            </Text>
          </TouchableOpacity></PermissionGate>
        }
        eyebrow="Portfolio Intelligence"
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

      <Text className="mt-2 px-1 text-xs leading-5 text-description">
        {guidance}
      </Text>
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
    <View className="min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-textPrimary/10 bg-white px-2 py-2.5">
      <MaterialCommunityIcons name={icon} color="#8A77F4" size={15} />
      <Text
        className="font-ralewayBold text-[10px] text-textPrimary"
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
