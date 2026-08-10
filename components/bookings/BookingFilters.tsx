import { Text, TouchableOpacity, View } from "react-native";

import type { Property } from "../../types";
import type { StatusFilter } from "../../utils/bookings/bookingCalendar";
import { BuildingChoices } from "./BuildingChoices";

const STATUS_OPTIONS = [
  { label: "Confirmed", value: "Booked" },
  { label: "All", value: "All" },
] as const;

type BookingFiltersProps = {
  buildings: Property[];
  selectedBuilding?: Property;
  selectedStatus: StatusFilter;
  onSelectBuilding: (id: string) => void;
  onSelectStatus: (status: StatusFilter) => void;
};

export function BookingFilters({
  buildings,
  selectedBuilding,
  selectedStatus,
  onSelectBuilding,
  onSelectStatus,
}: BookingFiltersProps) {
  return (
    <View className="gap-3 rounded-[24px] border border-secondary/20 bg-white p-4 shadow-sm shadow-secondary/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-slate-400">
            Property calendar
          </Text>
          <Text
            className="mt-1 font-ralewayBold text-lg text-textPrimary"
            numberOfLines={1}
          >
            {selectedBuilding?.title ?? "No building selected"}
          </Text>
        </View>
        <View className="flex-row rounded-full bg-secondary/10 p-1">
          {STATUS_OPTIONS.map((option) => {
            const selected = selectedStatus === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.78}
                accessibilityLabel={`Show ${option.label.toLowerCase()} reservations`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`h-11 justify-center rounded-full px-3 ${
                  selected ? "bg-secondary" : "bg-transparent"
                }`}
                onPress={() => onSelectStatus(option.value)}
              >
                <Text
                  className={`font-ralewayExtraBold text-xs ${
                    selected ? "text-white" : "text-slate-600"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {buildings.length > 0 ? (
        <BuildingChoices
          buildings={buildings}
          onSelect={onSelectBuilding}
          selectedId={selectedBuilding?.id ?? ""}
        />
      ) : null}
    </View>
  );
}
