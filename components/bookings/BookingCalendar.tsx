import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import type { TransientBooking } from "../../types";
import {
  getAvailabilityForDay,
  getBookingsForDay,
} from "../../utils/bookings/bookingAvailability";
import {
  addDays,
  dateKey,
  getMonthDays,
  parseDate,
  type BookingCalendarView,
  weekdayLabels,
} from "../../utils/bookings/bookingCalendar";
import { BOOKING_CALENDAR_LEGEND } from "../../utils/bookings/bookingPresentation";

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const shortMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
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
  mode: BookingCalendarView;
  propertyTitle?: string;
  roomCount: number;
  selectedDate: string;
  onChangePeriod: (mode: BookingCalendarView, offset: number) => void;
  onGoToToday: () => void;
  onSelectDay: (day: Date) => void;
};

export function BookingCalendar({
  availabilityBookings,
  bookings,
  currentMonth,
  mode,
  propertyTitle,
  roomCount,
  selectedDate,
  onChangePeriod,
  onGoToToday,
  onSelectDay,
}: BookingCalendarProps) {
  const selectedDay = parseDate(selectedDate);
  const weekDays = getWeekDays(selectedDay);
  const visibleDays =
    mode === "month"
      ? getMonthDays(currentMonth)
      : mode === "week"
        ? weekDays
        : [selectedDay];
  const today = new Date();
  const todayKey = dateKey(today);
  const isViewingToday = isPeriodContainingToday(
    mode,
    currentMonth,
    selectedDay,
    today,
  );
  const periodLabel = getPeriodLabel(mode, currentMonth, selectedDay, weekDays);

  return (
    <View className="overflow-hidden rounded-[24px] border border-primary/15 bg-white">
      <View className="flex-row items-center gap-2 px-4 py-4">
        <View className="min-w-0 flex-1">
          <Text
            className="font-ralewayBold text-lg text-textPrimary"
            numberOfLines={1}
          >
            {periodLabel}
          </Text>
          {propertyTitle ? (
            <Text
              className="mt-0.5 font-ralewaySemiBold text-xs text-description"
              numberOfLines={1}
            >
              {propertyTitle}
            </Text>
          ) : null}
        </View>
        {!isViewingToday ? (
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
          accessibilityLabel={`Previous ${mode}`}
          icon="chevron-back"
          onPress={() => onChangePeriod(mode, -1)}
        />
        <MonthButton
          accessibilityLabel={`Next ${mode}`}
          icon="chevron-forward"
          onPress={() => onChangePeriod(mode, 1)}
        />
      </View>

      {mode === "day" ? (
        <CalendarDaySummary
          availabilityBookings={availabilityBookings}
          bookings={bookings}
          day={selectedDay}
        />
      ) : (
        <>
          <View className="flex-row border-y border-primary/10 bg-white py-3">
            {weekdayLabels.map((day) => (
              <Text
                key={day}
                className="flex-1 text-center font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description"
              >
                {day.slice(0, 2)}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap px-1 py-2">
            {visibleDays.map((day) => (
              <CalendarDay
                availabilityBookings={availabilityBookings}
                bookings={bookings}
                currentMonth={currentMonth}
                day={day}
                isMonthView={mode === "month"}
                key={dateKey(day)}
                roomCount={roomCount}
                selectedDate={selectedDate}
                todayKey={todayKey}
                onPress={onSelectDay}
              />
            ))}
          </View>
        </>
      )}

      <View className="flex-row items-center justify-around border-t border-primary/10 px-5 py-3.5">
        {BOOKING_CALENDAR_LEGEND.map((item) => (
          <View className="flex-row items-center gap-2" key={item.label}>
            <View className={item.markerClassName} />
            <Text className="font-ralewayBold text-[10px] text-description">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function getWeekDays(day: Date) {
  const start = addDays(day, -day.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getPeriodLabel(
  mode: BookingCalendarView,
  currentMonth: Date,
  selectedDay: Date,
  weekDays: Date[],
) {
  if (mode === "month") return monthFormatter.format(currentMonth);
  if (mode === "day") return dayFormatter.format(selectedDay);

  const start = weekDays[0];
  const end = weekDays[6];
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${shortMonthFormatter.format(start)} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${shortMonthFormatter.format(start)} ${start.getDate()}–${shortMonthFormatter.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${shortMonthFormatter.format(start)} ${start.getDate()}, ${start.getFullYear()}–${shortMonthFormatter.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
}

function isPeriodContainingToday(
  mode: BookingCalendarView,
  currentMonth: Date,
  selectedDay: Date,
  today: Date,
) {
  if (mode === "month") {
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  }
  if (mode === "day") return dateKey(selectedDay) === dateKey(today);

  const weekStart = addDays(selectedDay, -selectedDay.getDay());
  const weekEnd = addDays(weekStart, 6);
  return today >= weekStart && today <= endOfDay(weekEnd);
}

function endOfDay(day: Date) {
  const value = new Date(day);
  value.setHours(23, 59, 59, 999);
  return value;
}

function CalendarDaySummary({
  availabilityBookings,
  bookings,
  day,
}: {
  availabilityBookings: TransientBooking[];
  bookings: TransientBooking[];
  day: Date;
}) {
  const dayBookings = getBookingsForDay(bookings, day);
  const availability = getAvailabilityForDay(availabilityBookings, day);

  return (
    <View className="flex-row items-center gap-3 border-y border-primary/10 bg-primary/5 px-4 py-4">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Text className="font-ralewayExtraBold text-xl text-white">
          {day.getDate()}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-sm text-textPrimary">
          {weekdayFormatter.format(day)}
        </Text>
        <Text className="mt-0.5 font-ralewaySemiBold text-xs text-description">
          {dayBookings.length}{" "}
          {dayBookings.length === 1 ? "reservation" : "reservations"}
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
      className="h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-white"
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
  isMonthView,
  roomCount,
  selectedDate,
  todayKey,
  onPress,
}: {
  availabilityBookings: TransientBooking[];
  bookings: TransientBooking[];
  currentMonth: Date;
  day: Date;
  isMonthView: boolean;
  roomCount: number;
  selectedDate: string;
  todayKey: string;
  onPress: (day: Date) => void;
}) {
  const key = dateKey(day);
  const dayBookings = getBookingsForDay(bookings, day);
  const activeBookings = dayBookings.filter(
    (booking) => booking.status === "Booked",
  );
  const activeBookingCount = activeBookings.length;
  const cancelledBookingCount = dayBookings.length - activeBookingCount;
  const availability = getAvailabilityForDay(availabilityBookings, day);
  const bookedRoomCount = new Set(
    activeBookings.map((booking) => booking.roomId || booking.roomNumber),
  ).size;
  const isTurnover = activeBookings.some((booking) => booking.endDate === key);
  const isFull = roomCount > 0 && bookedRoomCount >= roomCount;
  const calendarStateLabel = isTurnover
    ? "Turnover"
    : isFull
      ? "Full"
      : activeBookingCount > 0
        ? "Booked"
        : "Open";
  const isInVisiblePeriod =
    !isMonthView ||
    (day.getMonth() === currentMonth.getMonth() &&
      day.getFullYear() === currentMonth.getFullYear());
  const isSelected = key === selectedDate;
  const isToday = key === todayKey;

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityHint="Shows this day's schedule"
      accessibilityLabel={`${spokenDateFormatter.format(day)}. ${calendarStateLabel}. ${availability.label}. ${activeBookingCount} active ${activeBookingCount === 1 ? "booking" : "bookings"}.${cancelledBookingCount ? ` ${cancelledBookingCount} cancelled.` : ""}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`${isMonthView ? "h-16" : "h-14"} items-center justify-center ${isInVisiblePeriod ? "" : "opacity-40"}`}
      onPress={() => onPress(day)}
      style={{ width: "14.2857%" }}
    >
      <View
        className={`h-8 w-8 items-center justify-center rounded-full ${
          isSelected
            ? "bg-primary"
            : isToday
              ? "border-2 border-primary bg-white"
              : "bg-transparent"
        }`}
      >
        <Text
          className={`font-ralewayExtraBold text-[13px] ${
            isSelected
              ? "text-white"
              : isInVisiblePeriod
                ? isToday
                  ? "text-primary"
                  : "text-textPrimary"
                : "text-description/60"
          }`}
        >
          {day.getDate()}
        </Text>
      </View>
      <View className="mt-1 h-4 items-center justify-center">
        {isInVisiblePeriod && isTurnover ? (
          <View className="h-2 w-2 rotate-45 rounded-[1px] bg-turnover" />
        ) : isInVisiblePeriod && isFull ? (
          <View className="h-2 w-2 rounded-[2px] bg-danger" />
        ) : isInVisiblePeriod && activeBookingCount > 1 ? (
          <View className="h-4 min-w-5 items-center justify-center rounded-full bg-textPrimary px-1">
            <Text className="font-ralewayExtraBold text-[9px] leading-[11px] text-white">
              {activeBookingCount > 9 ? "9+" : activeBookingCount}
            </Text>
          </View>
        ) : isInVisiblePeriod && activeBookingCount === 1 ? (
          <View className="h-2 w-2 rounded-full bg-textPrimary" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
