import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { BookingCalendarView } from "../../utils/bookings/bookingCalendar";

export type BookingViewMode = BookingCalendarView | "agenda";

const calendarViewOptions: Array<{
  label: string;
  value: BookingCalendarView;
}> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

export function BookingViewToggle({
  value,
  onChange,
}: {
  value: BookingViewMode;
  onChange: (value: BookingViewMode) => void;
}) {
  return (
    <View accessibilityRole="tablist" className="h-11 flex-row gap-2">
      <View className="h-11 min-w-0 flex-1 flex-row rounded-2xl bg-primary/10">
        {calendarViewOptions.map((option) => {
          const selected = value === option.value;

          return (
            <TouchableOpacity
              accessibilityLabel={`Show ${option.label.toLowerCase()} calendar`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              activeOpacity={0.8}
              className={`h-11 flex-1 items-center justify-center rounded-2xl ${
                selected ? "bg-primary" : "bg-transparent"
              }`}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <Text
                className={`font-ralewayExtraBold text-[11px] ${
                  selected ? "text-white" : "text-primary"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        accessibilityLabel="Show booking agenda"
        accessibilityRole="tab"
        accessibilityState={{ selected: value === "agenda" }}
        activeOpacity={0.8}
        className={`h-11 w-[94px] flex-row items-center justify-center gap-1.5 rounded-2xl border ${
          value === "agenda"
            ? "border-primary bg-primary"
            : "border-primary/20 bg-white"
        }`}
        onPress={() => onChange("agenda")}
      >
        <Ionicons
          color={value === "agenda" ? "#FFFFFF" : "#8A77F4"}
          name="list-outline"
          size={16}
        />
        <Text
          className={`font-ralewayExtraBold text-[11px] ${
            value === "agenda" ? "text-white" : "text-primary"
          }`}
        >
          Agenda
        </Text>
      </TouchableOpacity>
    </View>
  );
}
