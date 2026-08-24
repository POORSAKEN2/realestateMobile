import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";

export function BookingCalendarLoading() {
  return (
    <SkeletonGroup
      accessibilityLabel="Loading booking calendar"
      className="gap-4"
    >
      <View className="overflow-hidden rounded-[24px] border border-primary/20 bg-white shadow-sm shadow-primary/10">
        <View className="flex-row items-center gap-2 px-4 pb-3 pt-4">
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-3 w-44 max-w-full" />
          </View>
          <SkeletonBlock className="h-11 w-11 rounded-full bg-primary/10" />
          <SkeletonBlock className="h-11 w-11 rounded-full bg-primary/10" />
        </View>

        <View className="flex-row border-y border-primary/10 bg-primary/5 py-2.5">
          {Array.from({ length: 7 }, (_, index) => (
            <View className="flex-1 items-center" key={index}>
              <SkeletonBlock className="h-2.5 w-3 rounded-full bg-primary/20" />
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap px-1 py-2">
          {Array.from({ length: 42 }, (_, index) => (
            <View
              className="h-14 items-center justify-center"
              key={index}
              style={{ width: "14.2857%" }}
            >
              <SkeletonBlock
                className={`h-8 w-8 rounded-full ${
                  index === 17 ? "bg-primary/20" : "bg-primary/10"
                }`}
              />
            </View>
          ))}
        </View>

        <View className="flex-row gap-4 border-t border-primary/10 px-4 py-3">
          {Array.from({ length: 3 }, (_, index) => (
            <View className="flex-row items-center gap-1.5" key={index}>
              <SkeletonBlock className="h-2 w-2 rounded-full bg-primary/20" />
              <SkeletonBlock className="h-2.5 w-14" />
            </View>
          ))}
        </View>
      </View>

      <View className="gap-3 rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-2.5 w-20" />
            <SkeletonBlock className="h-5 w-40 max-w-full" />
          </View>
          <SkeletonBlock className="h-7 w-20 rounded-full bg-primary/10" />
        </View>
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary/5 p-4">
          <SkeletonBlock className="h-10 w-10 rounded-xl bg-primary/10" />
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-4 w-32 max-w-full" />
            <SkeletonBlock className="h-3 w-48 max-w-full" />
          </View>
        </View>
        <SkeletonBlock className="h-12 w-full rounded-2xl bg-primary/20" />
      </View>
    </SkeletonGroup>
  );
}

export function BookingCalendarEmpty() {
  return (
    <View className="items-center rounded-[24px] border border-dashed border-primary/20 bg-white p-8">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Ionicons name="calendar-outline" color="#8A77F4" size={28} />
      </View>
      <Text className="mt-4 text-center font-ralewayBold text-base text-textPrimary">
        No bookable buildings yet
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-slate-500">
        Enable transient bookings in a property form to start using this
        calendar.
      </Text>
    </View>
  );
}
