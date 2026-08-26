import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export type BookingViewMode = "month" | "agenda";

const viewOptions: Array<{
  icon: "calendar-outline" | "list-outline";
  label: string;
  value: BookingViewMode;
}> = [
  { icon: "calendar-outline", label: "Month", value: "month" },
  { icon: "list-outline", label: "Agenda", value: "agenda" },
];

export function BookingViewToggle({
  value,
  onChange,
}: {
  value: BookingViewMode;
  onChange: (value: BookingViewMode) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      className="h-11 flex-row rounded-2xl bg-primary/10"
    >
      {viewOptions.map((option) => {
        const selected = value === option.value;

        return (
          <TouchableOpacity
            accessibilityLabel={`Show ${option.label.toLowerCase()} view`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
            className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${
              selected ? "bg-primary" : "bg-transparent"
            }`}
            key={option.value}
            onPress={() => onChange(option.value)}
          >
            <Ionicons
              color={selected ? "#FFFFFF" : "#8A77F4"}
              name={option.icon}
              size={17}
            />
            <Text
              className={`font-ralewayExtraBold text-xs ${
                selected ? "text-white" : "text-primary"
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
