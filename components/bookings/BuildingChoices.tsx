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
            className={`min-h-11 justify-center rounded-full border px-4 ${selected ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-200 bg-[#FFFFFF]"}`}
            onPress={() => onSelect(building.id)}
          >
            <Text
              className={`text-xs font-ralewayExtraBold ${selected ? "text-[#FFFFFF]" : "text-[#1d1d1f]"}`}
            >
              {building.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
