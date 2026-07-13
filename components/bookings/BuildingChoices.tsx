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
            className={`rounded-full border px-3.5 py-2.5 ${selected ? "border-[#2563EB] bg-[#2563EB]" : "border-[#1d1d1f]/10 bg-[#FFFFFF]"}`}
            onPress={() => onSelect(building.id)}
          >
            <Text
              className={`text-xs font-bold ${selected ? "text-[#FFFFFF]" : "text-[#1d1d1f]"}`}
            >
              {building.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
