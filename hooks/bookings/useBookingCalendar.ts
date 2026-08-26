import { useMemo, useState } from "react";

import type { TransientBooking } from "../../types";
import {
  getAvailabilityForDay,
  getBookingsForDay,
} from "../../utils/bookings/bookingAvailability";
import {
  addDays,
  dateKey,
  parseDate,
  type BookingCalendarView,
} from "../../utils/bookings/bookingCalendar";

type UseBookingCalendarOptions = {
  bookings: TransientBooking[];
  availabilityBookings: TransientBooking[];
};

export function useBookingCalendar({
  bookings,
  availabilityBookings,
}: UseBookingCalendarOptions) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const selectedDay = useMemo(() => parseDate(selectedDate), [selectedDate]);
  const selectedDayBookings = useMemo(
    () => getBookingsForDay(bookings, selectedDay),
    [bookings, selectedDay],
  );
  const selectedDayAvailability = useMemo(
    () => getAvailabilityForDay(availabilityBookings, selectedDay),
    [availabilityBookings, selectedDay],
  );
  const canCreateOnSelectedDay =
    selectedDayAvailability.label === "Available" ||
    selectedDayAvailability.label === "After 2 PM";

  function selectDay(day: Date) {
    setSelectedDate(dateKey(day));
    if (
      day.getFullYear() !== currentMonth.getFullYear() ||
      day.getMonth() !== currentMonth.getMonth()
    ) {
      setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  }

  function changePeriod(view: BookingCalendarView, offset: number) {
    if (view === "day" || view === "week") {
      selectDay(addDays(selectedDay, offset * (view === "week" ? 7 : 1)));
      return;
    }

    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    const lastDayOfNextMonth = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    selectDay(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDay.getDate(), lastDayOfNextMonth),
      ),
    );
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(dateKey(today));
  }

  return {
    canCreateOnSelectedDay,
    changePeriod,
    currentMonth,
    goToToday,
    selectDay,
    selectedDate,
    selectedDayAvailability,
    selectedDayBookings,
  };
}
