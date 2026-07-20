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
    <View className="gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Day schedule
          </Text>
          <Text className="mt-1 font-soraSemiBold text-lg text-slate-950">
            {dayLabel}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${availability.bg}`}>
          <Text className={`text-[11px] font-bold ${availability.text}`}>
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
              className="min-h-[64px] flex-row items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3"
              onPress={() => onOpenBooking(booking)}
            >
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Ionicons name="bed-outline" color="#2563EB" size={19} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-soraSemiBold text-sm text-slate-900"
                  numberOfLines={1}
                >
                  {booking.guestName}
                </Text>
                <Text className="mt-0.5 text-xs font-medium text-slate-500">
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
        <View className="flex-row items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
            <Ionicons name="sparkles-outline" color="#64748B" size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-slate-800">
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
          className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-blue-600"
          onPress={() => onCreate(date)}
        >
          <Ionicons name="add" color="#FFFFFF" size={20} />
          <Text className="font-soraSemiBold text-sm text-white">
            Add booking for this day
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
