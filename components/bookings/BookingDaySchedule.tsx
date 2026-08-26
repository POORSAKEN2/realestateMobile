import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { TransientBooking } from "../../types";
import {
  formatDisplayTime,
  parseDate,
  type Availability,
} from "../../utils/bookings/bookingCalendar";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
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
    <View className="gap-2.5 rounded-[22px] border border-primary/20 bg-white p-3 shadow-sm shadow-primary/10">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-base text-textPrimary">
            {dayLabel}
          </Text>
          <Text className="mt-0.5 font-ralewaySemiBold text-[11px] text-description">
            {bookings.length}{" "}
            {bookings.length === 1 ? "reservation" : "reservations"}
          </Text>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${availability.bg}`}>
          <Text
            className={`font-ralewayExtraBold text-[10px] ${availability.text}`}
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
              className="min-h-14 flex-row items-center gap-2.5 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2"
              onPress={() => onOpenBooking(booking)}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Ionicons name="bed-outline" color="#8A77F4" size={18} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-ralewayBold text-sm text-textPrimary"
                  numberOfLines={1}
                >
                  {booking.guestName}
                </Text>
                <Text className="mt-0.5 font-ralewaySemiBold text-xs text-description">
                  Room {booking.roomNumber} ·{" "}
                  {formatDisplayTime(booking.checkInTime)}–
                  {formatDisplayTime(booking.checkOutTime)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" color="#6F6D6D" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="min-h-12 flex-row items-center gap-2.5 rounded-2xl bg-primary/5 px-3 py-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Ionicons name="sparkles-outline" color="#8A77F4" size={17} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayExtraBold text-sm text-textPrimary">
              No stays scheduled
            </Text>
            <Text className="mt-0.5 text-xs text-description">
              This day has no visible reservations.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={canCreate ? 0.8 : 1}
        accessibilityLabel={
          canCreate
            ? `Add booking on ${dayLabel}`
            : `Cannot add booking on ${dayLabel}. No availability.`
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !canCreate }}
        className={`h-11 flex-row items-center justify-center gap-2 rounded-2xl ${
          canCreate ? "bg-primary" : "bg-description/10"
        }`}
        disabled={!canCreate}
        onPress={() => onCreate(date)}
      >
        <Ionicons
          name={canCreate ? "add" : "lock-closed-outline"}
          color={canCreate ? "#FFFFFF" : "#6F6D6D"}
          size={18}
        />
        <Text
          className={`font-ralewayBold text-xs ${
            canCreate ? "text-white" : "text-description"
          }`}
        >
          {canCreate ? "Add booking" : "No availability this day"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
