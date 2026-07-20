import { useMemo, useState } from "react";

import type { TransientBooking } from "../../types";
import {
  getAvailabilityForDay,
  getBookingsForDay,
} from "../../utils/bookings/bookingAvailability";
import { dateKey, parseDate } from "../../utils/bookings/bookingCalendar";

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

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth));
  }

  function selectDay(day: Date) {
    setSelectedDate(dateKey(day));
    if (
      day.getFullYear() !== currentMonth.getFullYear() ||
      day.getMonth() !== currentMonth.getMonth()
    ) {
      setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
    }
  }

  function goToToday() {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(dateKey(today));
  }

  return {
    canCreateOnSelectedDay,
    changeMonth,
    currentMonth,
    goToToday,
    selectDay,
    selectedDate,
    selectedDayAvailability,
    selectedDayBookings,
  };
}
