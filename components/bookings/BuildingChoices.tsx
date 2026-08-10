import { ScrollView, Text, TouchableOpacity } from "react-native";

import type { Property } from "../../types";

export function BuildingChoices({
  buildings,
  selectedId,
  onSelect,
}: {
  buildings: Property[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2"
    >
      {buildings.map((building) => {
        const selected = building.id === selectedId;
        return (
          <TouchableOpacity
            key={building.id}
            activeOpacity={0.8}
            accessibilityLabel={`Show calendar for ${building.title}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-11 justify-center rounded-full border px-4 ${selected ? "border-secondary bg-secondary" : "border-secondary/20 bg-[#FFFFFF]"}`}
            onPress={() => onSelect(building.id)}
          >
            <Text
              className={`font-ralewayExtraBold text-xs ${selected ? "text-[#FFFFFF]" : "text-textPrimary"}`}
            >
              {building.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
