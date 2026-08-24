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
  hasActiveFilters?: boolean;
  isLoading: boolean;
  onOpenBooking: (booking: TransientBooking) => void;
};

export function BookingReservationList({
  bookings,
  buildingTitle,
  hasActiveFilters = false,
  isLoading,
  onOpenBooking,
}: BookingReservationListProps) {
  const sortedBookings = bookings
    .slice()
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <View className="mb-16 gap-3 rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-end justify-between gap-3">
        <View>
          <Text className="font-ralewayBold text-lg text-textPrimary">
            All reservations
          </Text>
          <Text className="mt-1 font-ralewaySemiBold text-xs text-slate-500">
            {buildingTitle ?? "Select a building"}
          </Text>
        </View>
        <Text className="font-ralewayExtraBold text-xs text-slate-400">
          {bookings.length} total
        </Text>
      </View>

      {isLoading ? (
        <Text className="font-ralewaySemiBold text-sm text-slate-500">
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
        <View className="items-center rounded-2xl border border-dashed border-primary/20 p-6">
          <Text className="text-center font-ralewayExtraBold text-sm text-slate-800">
            {hasActiveFilters
              ? "No matching reservations"
              : "No reservations found"}
          </Text>
          <Text className="mt-1 text-center text-xs leading-5 text-slate-500">
            {hasActiveFilters
              ? "Change the search or filters to see more reservations."
              : "Select an available day to add your first booking."}
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
      className="min-h-[76px] flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3"
      onPress={() => onPress(booking)}
    >
      <View className="w-12 items-center rounded-xl bg-primary/10 py-2">
        <Text className="font-ralewayExtraBold text-[10px] uppercase text-slate-400">
          {monthFormatter.format(startDate)}
        </Text>
        <Text className="font-ralewayBold text-lg text-textPrimary">
          {startDate.getDate()}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className="font-ralewayBold text-sm text-textPrimary"
          numberOfLines={1}
        >
          {booking.guestName}
        </Text>
        <Text className="mt-1 font-ralewaySemiBold text-xs text-slate-500">
          Room {booking.roomNumber} · {formatDisplayDate(booking.startDate)}–
          {formatDisplayDate(booking.endDate)}
        </Text>
        <View
          className={`mt-2 self-start rounded-full px-2 py-1 ${status.backgroundClassName}`}
        >
          <Text
            className={`font-ralewayExtraBold text-[10px] ${status.textClassName}`}
          >
            {status.label}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" color="#94A3B8" size={18} />
    </TouchableOpacity>
  );
}
