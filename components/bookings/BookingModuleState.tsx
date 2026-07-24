import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";

export function BookingCalendarLoading() {
  return (
    <View className="items-center rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
      <ActivityIndicator color="#2563EB" />
      <Text className="mt-3 text-sm font-ralewayBold text-slate-700">
        Loading calendar
      </Text>
    </View>
  );
}

export function BookingCalendarEmpty() {
  return (
    <View className="items-center rounded-[24px] border border-dashed border-slate-300 bg-white p-8">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <Ionicons name="calendar-outline" color="#2563EB" size={28} />
      </View>
      <Text className="mt-4 text-center font-ralewayBold text-base text-slate-950">
        No bookable buildings yet
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-slate-500">
        Enable transient bookings in a property form to start using this
        calendar.
      </Text>
    </View>
  );
}
