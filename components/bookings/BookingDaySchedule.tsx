import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { TransientBooking } from "../../types";
import {
  formatDisplayTime,
  parseDate,
  type Availability,
} from "../../utils/bookings/bookingCalendar";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

type BookingDayScheduleProps = {
  availability: Availability;
  bookings: TransientBooking[];
  canCreate: boolean;
  date: string;
  onCreate: (date: string) => void;
  onOpenBooking: (booking: TransientBooking) => void;
};

export function BookingDaySchedule({
  availability,
  bookings,
  canCreate,
  date,
  onCreate,
  onOpenBooking,
}: BookingDayScheduleProps) {
  const dayLabel = dayFormatter.format(parseDate(date));

  return (
    <View className="gap-3 rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-slate-400">
            Day schedule
          </Text>
          <Text className="mt-1 font-ralewayBold text-lg text-textPrimary">
            {dayLabel}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${availability.bg}`}>
          <Text
            className={`font-ralewayExtraBold text-[11px] ${availability.text}`}
          >
            {availability.label}
          </Text>
        </View>
      </View>

      {bookings.length > 0 ? (
        <View className="gap-2">
          {bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              activeOpacity={0.78}
              accessibilityLabel={`Open booking for ${booking.guestName}, room ${booking.roomNumber}`}
              accessibilityRole="button"
              className="min-h-[64px] flex-row items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-3"
              onPress={() => onOpenBooking(booking)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name="bed-outline" color="#8A77F4" size={19} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-ralewayBold text-sm text-textPrimary"
                  numberOfLines={1}
                >
                  {booking.guestName}
                </Text>
                <Text className="mt-0.5 font-ralewaySemiBold text-xs text-slate-500">
                  Room {booking.roomNumber} ·{" "}
                  {formatDisplayTime(booking.checkInTime)}–
                  {formatDisplayTime(booking.checkOutTime)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" color="#94A3B8" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="flex-row items-center gap-3 rounded-2xl bg-primary/5 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Ionicons name="sparkles-outline" color="#8A77F4" size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayExtraBold text-sm text-slate-800">
              No stays scheduled
            </Text>
            <Text className="mt-0.5 text-xs leading-5 text-slate-500">
              This day has no visible reservations.
            </Text>
          </View>
        </View>
      )}

      {canCreate ? (
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityLabel={`Add booking on ${dayLabel}`}
          accessibilityRole="button"
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-secondary"
          onPress={() => onCreate(date)}
        >
          <Ionicons name="add" color="#FFFFFF" size={20} />
          <Text className="font-ralewayBold text-sm text-white">
            Add booking for this day
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
