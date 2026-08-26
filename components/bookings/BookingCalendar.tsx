import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { TransientBooking } from "../../types";
import {
  getAvailabilityForDay,
  getBookingsForDay,
} from "../../utils/bookings/bookingAvailability";
import {
  dateKey,
  getMonthDays,
  weekdayLabels,
} from "../../utils/bookings/bookingCalendar";
import {
  BOOKING_CALENDAR_LEGEND,
  getAvailabilityMarkerClass,
} from "../../utils/bookings/bookingPresentation";

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const spokenDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

type BookingCalendarProps = {
  availabilityBookings: TransientBooking[];
  bookings: TransientBooking[];
  currentMonth: Date;
  propertyTitle?: string;
  selectedDate: string;
  onChangeMonth: (offset: number) => void;
  onGoToToday: () => void;
  onSelectDay: (day: Date) => void;
};

export function BookingCalendar({
  availabilityBookings,
  bookings,
  currentMonth,
  propertyTitle,
  selectedDate,
  onChangeMonth,
  onGoToToday,
  onSelectDay,
}: BookingCalendarProps) {
  const monthDays = getMonthDays(currentMonth);
  const today = new Date();
  const todayKey = dateKey(today);
  const isViewingCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() &&
    currentMonth.getMonth() === today.getMonth();

  return (
    <View className="overflow-hidden rounded-[22px] border border-primary/20 bg-white shadow-sm shadow-primary/10">
      <View className="flex-row items-center gap-2 px-3 py-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-base text-textPrimary">
            {monthFormatter.format(currentMonth)}
          </Text>
          {propertyTitle ? (
            <Text
              className="mt-0.5 font-ralewaySemiBold text-[11px] text-description"
              numberOfLines={1}
            >
              {propertyTitle}
            </Text>
          ) : null}
        </View>
        {!isViewingCurrentMonth ? (
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityLabel="Return to today"
            accessibilityRole="button"
            className="h-11 justify-center rounded-full bg-primary/10 px-3"
            onPress={onGoToToday}
          >
            <Text className="font-ralewayExtraBold text-xs text-primary">
              Today
            </Text>
          </TouchableOpacity>
        ) : null}
        <MonthButton
          accessibilityLabel="Previous month"
          icon="chevron-back"
          onPress={() => onChangeMonth(-1)}
        />
        <MonthButton
          accessibilityLabel="Next month"
          icon="chevron-forward"
          onPress={() => onChangeMonth(1)}
        />
      </View>

      <View className="flex-row border-y border-primary/10 bg-primary/5 py-2">
        {weekdayLabels.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description"
          >
            {day.slice(0, 2)}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap px-1 py-1.5">
        {monthDays.map((day) => (
          <CalendarDay
            availabilityBookings={availabilityBookings}
            bookings={bookings}
            currentMonth={currentMonth}
            day={day}
            key={dateKey(day)}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onPress={onSelectDay}
          />
        ))}
      </View>

      <View className="flex-row items-center justify-between border-t border-primary/10 px-3 py-2.5">
        {BOOKING_CALENDAR_LEGEND.map((item) => (
          <View className="flex-row items-center gap-1" key={item.label}>
            <View className={item.markerClassName} />
            <Text className="font-ralewayBold text-[9px] text-description">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MonthButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: "chevron-back" | "chevron-forward";
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
      onPress={onPress}
    >
      <Ionicons name={icon} color="#8A77F4" size={19} />
    </TouchableOpacity>
  );
}

function CalendarDay({
  availabilityBookings,
  bookings,
  currentMonth,
  day,
  selectedDate,
  todayKey,
  onPress,
}: {
  availabilityBookings: TransientBooking[];
  bookings: TransientBooking[];
  currentMonth: Date;
  day: Date;
  selectedDate: string;
  todayKey: string;
  onPress: (day: Date) => void;
}) {
  const key = dateKey(day);
  const dayBookings = getBookingsForDay(bookings, day);
  const activeBookingCount = dayBookings.filter(
    (booking) => booking.status === "Booked",
  ).length;
  const cancelledBookingCount = dayBookings.length - activeBookingCount;
  const availability = getAvailabilityForDay(availabilityBookings, day);
  const isCurrentMonth =
    day.getMonth() === currentMonth.getMonth() &&
    day.getFullYear() === currentMonth.getFullYear();
  const isSelected = key === selectedDate;
  const isToday = key === todayKey;

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityHint="Shows this day's schedule"
      accessibilityLabel={`${spokenDateFormatter.format(day)}. ${availability.label}. ${activeBookingCount} active ${activeBookingCount === 1 ? "booking" : "bookings"}.${cancelledBookingCount ? ` ${cancelledBookingCount} cancelled.` : ""}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`h-12 items-center justify-center ${isCurrentMonth ? "" : "opacity-40"}`}
      onPress={() => onPress(day)}
      style={{ width: "14.2857%" }}
    >
      <View
        className={`h-7 w-7 items-center justify-center rounded-full ${
          isSelected
            ? "bg-primary"
            : isToday
              ? "border border-primary bg-primary/10"
              : "bg-transparent"
        }`}
      >
        <Text
          className={`font-ralewayExtraBold text-[13px] ${
            isSelected
              ? "text-white"
              : isCurrentMonth
                ? isToday
                  ? "text-primary"
                  : "text-textPrimary"
                : "text-description/60"
          }`}
        >
          {day.getDate()}
        </Text>
      </View>
      <View className="mt-0.5 h-3.5 flex-row items-center justify-center gap-1">
        {activeBookingCount > 0 ? (
          <View className="h-3.5 min-w-4 items-center justify-center rounded-full bg-info px-1">
            <Text className="font-ralewayExtraBold text-[8px] leading-[10px] text-white">
              {activeBookingCount > 9 ? "9+" : activeBookingCount}
            </Text>
          </View>
        ) : cancelledBookingCount > 0 ? (
          <View className="h-3.5 min-w-4 items-center justify-center rounded-full bg-description/30 px-1">
            <Text className="font-ralewayExtraBold text-[8px] leading-[10px] text-description">
              {cancelledBookingCount > 9 ? "9+" : cancelledBookingCount}
            </Text>
          </View>
        ) : null}
        {activeBookingCount > 0 && cancelledBookingCount > 0 ? (
          <View className="h-1.5 w-2.5 rounded-full bg-description/30" />
        ) : null}
        {isCurrentMonth ? (
          <View className={getAvailabilityMarkerClass(availability)} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
