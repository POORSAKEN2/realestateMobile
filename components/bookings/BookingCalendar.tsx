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
  getAvailabilityDotClass,
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
  selectedDate: string;
  onChangeMonth: (offset: number) => void;
  onGoToToday: () => void;
  onSelectDay: (day: Date) => void;
};

export function BookingCalendar({
  availabilityBookings,
  bookings,
  currentMonth,
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
    <View className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <View className="flex-row items-center gap-2 px-4 pb-3 pt-4">
        <View className="min-w-0 flex-1">
          <Text className="font-soraSemiBold text-lg text-slate-950">
            {monthFormatter.format(currentMonth)}
          </Text>
          <Text className="mt-0.5 text-xs font-medium text-slate-500">
            Select a day to see its schedule
          </Text>
        </View>
        {!isViewingCurrentMonth ? (
          <TouchableOpacity
            activeOpacity={0.78}
            accessibilityLabel="Return to today"
            accessibilityRole="button"
            className="h-11 justify-center rounded-full bg-blue-50 px-3"
            onPress={onGoToToday}
          >
            <Text className="text-xs font-bold text-blue-700">Today</Text>
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

      <View className="flex-row border-y border-slate-100 bg-slate-50/80 py-2.5">
        {weekdayLabels.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400"
          >
            {day.slice(0, 1)}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap px-1 py-2">
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

      <View className="flex-row flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-3">
        {BOOKING_CALENDAR_LEGEND.map((item) => (
          <View className="flex-row items-center gap-1.5" key={item.label}>
            <View className={`h-2 w-2 rounded-full ${item.colorClassName}`} />
            <Text className="text-[11px] font-semibold text-slate-500">
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
      className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white"
      onPress={onPress}
    >
      <Ionicons name={icon} color="#334155" size={19} />
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
  const availability = getAvailabilityForDay(availabilityBookings, day);
  const isCurrentMonth =
    day.getMonth() === currentMonth.getMonth() &&
    day.getFullYear() === currentMonth.getFullYear();
  const isSelected = key === selectedDate;
  const isToday = key === todayKey;

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      accessibilityLabel={`${spokenDateFormatter.format(day)}. ${availability.label}. ${dayBookings.length} ${dayBookings.length === 1 ? "booking" : "bookings"}.`}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className="h-14 items-center justify-center"
      onPress={() => onPress(day)}
      style={{ width: "14.2857%" }}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          isSelected
            ? "bg-blue-600"
            : isToday
              ? "border border-blue-500 bg-blue-50"
              : "bg-transparent"
        }`}
      >
        <Text
          className={`text-[13px] font-bold ${
            isSelected
              ? "text-white"
              : isCurrentMonth
                ? isToday
                  ? "text-blue-700"
                  : "text-slate-800"
                : "text-slate-300"
          }`}
        >
          {day.getDate()}
        </Text>
      </View>
      <View className="mt-0.5 h-2 flex-row items-center justify-center gap-0.5">
        {dayBookings.length > 0 ? (
          dayBookings
            .slice(0, 3)
            .map((booking) => (
              <View
                key={booking.id}
                className={`h-1.5 w-1.5 rounded-full ${
                  booking.status === "Cancelled"
                    ? "bg-slate-300"
                    : "bg-blue-500"
                }`}
              />
            ))
        ) : isCurrentMonth ? (
          <View
            className={`h-1.5 w-1.5 rounded-full ${getAvailabilityDotClass(
              availability,
            )}`}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
