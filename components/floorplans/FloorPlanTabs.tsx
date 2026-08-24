import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity } from "react-native";

import type { FloorPlan } from "../../types";

export function FloorPlanTabs({
  activeFloorId,
  floorPlans,
  onSelectFloor,
}: {
  activeFloorId: string;
  floorPlans: FloorPlan[];
  onSelectFloor: (id: string) => void;
}) {
  return (
    <ScrollView
      className="-mx-6 mt-4 max-h-12"
      contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {floorPlans.map((floor) => {
        const selected = floor.id === activeFloorId;

        return (
          <TouchableOpacity
            accessibilityLabel={`Select ${floor.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`h-11 flex-row items-center gap-2 rounded-2xl px-4 ${
              selected ? "bg-primary" : "border border-primary/20 bg-white"
            }`}
            key={floor.id}
            onPress={() => onSelectFloor(floor.id)}
          >
            <MaterialCommunityIcons
              name="layers-outline"
              color={selected ? "#FFFFFF" : "#8A77F4"}
              size={17}
            />
            <Text
              className={`font-ralewayBold text-xs ${
                selected ? "text-white" : "text-textPrimary"
              }`}
            >
              {floor.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
