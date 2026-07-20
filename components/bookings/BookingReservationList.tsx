import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { TransientBooking } from "../../types";
import {
  formatDisplayDate,
  parseDate,
} from "../../utils/bookings/bookingCalendar";
import { getBookingStatusPresentation } from "../../utils/bookings/bookingPresentation";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

type BookingReservationListProps = {
  bookings: TransientBooking[];
  buildingTitle?: string;
  isLoading: boolean;
  onOpenBooking: (booking: TransientBooking) => void;
};

export function BookingReservationList({
  bookings,
  buildingTitle,
  isLoading,
  onOpenBooking,
}: BookingReservationListProps) {
  const sortedBookings = bookings
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <View className="mb-16 gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <View className="flex-row items-end justify-between gap-3">
        <View>
          <Text className="font-soraSemiBold text-lg text-slate-950">
            All reservations
          </Text>
          <Text className="mt-1 text-xs font-medium text-slate-500">
            {buildingTitle ?? "Select a building"}
          </Text>
        </View>
        <Text className="text-xs font-bold text-slate-400">
          {bookings.length} total
        </Text>
      </View>

      {isLoading ? (
        <Text className="text-sm font-medium text-slate-500">
          Loading reservations...
        </Text>
      ) : sortedBookings.length > 0 ? (
        sortedBookings.map((booking) => (
          <ReservationCard
            booking={booking}
            key={booking.id}
            onPress={onOpenBooking}
          />
        ))
      ) : (
        <View className="items-center rounded-2xl border border-dashed border-slate-200 p-6">
          <Text className="text-center text-sm font-bold text-slate-800">
            No reservations found
          </Text>
          <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
            Select an available day to add your first booking.
          </Text>
        </View>
      )}
    </View>
  );
}

function ReservationCard({
  booking,
  onPress,
}: {
  booking: TransientBooking;
  onPress: (booking: TransientBooking) => void;
}) {
  const status = getBookingStatusPresentation(booking);
  const startDate = parseDate(booking.startDate);

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityLabel={`Open ${status.label} booking for ${booking.guestName}`}
      accessibilityRole="button"
      className="min-h-[76px] flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3"
      onPress={() => onPress(booking)}
    >
      <View className="w-12 items-center rounded-xl bg-slate-50 py-2">
        <Text className="text-[10px] font-bold uppercase text-slate-400">
          {monthFormatter.format(startDate)}
        </Text>
        <Text className="font-soraSemiBold text-lg text-slate-900">
          {startDate.getDate()}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="font-soraSemiBold text-sm text-slate-900"
          numberOfLines={1}
        >
          {booking.guestName}
        </Text>
        <Text className="mt-1 text-xs font-medium text-slate-500">
          Room {booking.roomNumber} · {formatDisplayDate(booking.startDate)}–
          {formatDisplayDate(booking.endDate)}
        </Text>
        <View
          className={`mt-2 self-start rounded-full px-2 py-1 ${status.backgroundClassName}`}
        >
          <Text className={`text-[10px] font-bold ${status.textClassName}`}>
            {status.label}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color="#94A3B8" size={18} />
    </TouchableOpacity>
  );
}
