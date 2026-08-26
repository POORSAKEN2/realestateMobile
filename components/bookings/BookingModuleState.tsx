import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { BookingCalendarView } from "../../utils/bookings/bookingCalendar";
import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";

export function BookingCalendarLoading({
  mode = "month",
}: {
  mode?: BookingCalendarView;
}) {
  const visibleDayCount = mode === "month" ? 42 : 7;

  return (
    <SkeletonGroup
      accessibilityLabel="Loading booking calendar"
      className="gap-4"
    >
      <View className="overflow-hidden rounded-[24px] border border-primary/15 bg-white">
        <View className="flex-row items-center gap-2 px-4 py-4">
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-3 w-44 max-w-full" />
          </View>
          <SkeletonBlock className="h-11 w-11 rounded-2xl bg-primary/10" />
          <SkeletonBlock className="h-11 w-11 rounded-2xl bg-primary/10" />
        </View>

        {mode === "day" ? (
          <View className="flex-row items-center gap-3 border-y border-primary/10 bg-primary/5 px-4 py-4">
            <SkeletonBlock className="h-14 w-14 rounded-2xl bg-primary/20" />
            <View className="min-w-0 flex-1 gap-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-3 w-20" />
            </View>
            <SkeletonBlock className="h-6 w-20 rounded-full bg-primary/10" />
          </View>
        ) : (
          <>
            <View className="flex-row border-y border-primary/10 bg-white py-3">
              {Array.from({ length: 7 }, (_, index) => (
                <View className="flex-1 items-center" key={index}>
                  <SkeletonBlock className="h-2.5 w-3 rounded-full bg-primary/20" />
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap px-1 py-1.5">
              {Array.from({ length: visibleDayCount }, (_, index) => (
                <View
                  className={`${mode === "month" ? "h-16" : "h-14"} items-center justify-center`}
                  key={index}
                  style={{ width: "14.2857%" }}
                >
                  <SkeletonBlock
                    className={`h-7 w-7 rounded-full ${
                      index === 3 ? "bg-primary/20" : "bg-primary/10"
                    }`}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        <View className="flex-row justify-around border-t border-primary/10 px-5 py-3.5">
          {Array.from({ length: 3 }, (_, index) => (
            <View className="flex-row items-center gap-1.5" key={index}>
              <SkeletonBlock className="h-2 w-2 rounded-full bg-primary/20" />
              <SkeletonBlock className="h-2.5 w-10" />
            </View>
          ))}
        </View>
      </View>

      <View className="gap-2.5 rounded-[22px] border border-primary/20 bg-white p-3 shadow-sm shadow-primary/10">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-2.5 w-20" />
            <SkeletonBlock className="h-5 w-40 max-w-full" />
          </View>
          <SkeletonBlock className="h-6 w-20 rounded-full bg-primary/10" />
        </View>
        <View className="min-h-12 flex-row items-center gap-2.5 rounded-2xl bg-primary/5 px-3 py-2">
          <SkeletonBlock className="h-9 w-9 rounded-xl bg-primary/10" />
          <View className="min-w-0 flex-1 gap-2">
            <SkeletonBlock className="h-4 w-32 max-w-full" />
            <SkeletonBlock className="h-3 w-48 max-w-full" />
          </View>
        </View>
        <SkeletonBlock className="h-11 w-full rounded-2xl bg-primary/20" />
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
      <Text className="mt-1 text-center text-sm leading-5 text-description">
        Enable transient bookings in a property form to start using this
        calendar.
      </Text>
    </View>
  );
}
