import {
  DEFAULT_CHECK_OUT_TIME,
  rangesOverlap,
  toBookingDateTime,
} from "../../api/bookings";
import type { TransientBooking } from "../../types";
import { dateKey, getDayWindow, type Availability } from "./bookingCalendar";

export function getBookingsForDay(bookings: TransientBooking[], day: Date) {
  const dayWindow = getDayWindow(day);
  return bookings.filter((booking) =>
    rangesOverlap(
      dayWindow.start,
      dayWindow.end,
      toBookingDateTime(booking.startDate, booking.checkInTime),
      toBookingDateTime(booking.endDate, booking.checkOutTime),
    ),
  );
}

export function getAvailabilityForDay(
  bookings: TransientBooking[],
  day: Date,
): Availability {
  const key = dateKey(day);
  const activeBookings = bookings.filter(
    (booking) => booking.status === "Booked",
  );
  const dayBookings = getBookingsForDay(activeBookings, day);
  const checkingOutToday = activeBookings.some(
    (booking) =>
      booking.endDate === key && booking.checkOutTime <= DEFAULT_CHECK_OUT_TIME,
  );
  const checkingInToday = activeBookings.some(
    (booking) => booking.startDate === key,
  );

  if (
    dayBookings.length > 0 &&
    dayBookings.every(
      (booking) =>
        booking.endDate === key &&
        booking.checkOutTime <= DEFAULT_CHECK_OUT_TIME,
    ) &&
    !checkingInToday
  ) {
    return { label: "After 2 PM", bg: "bg-sky-50", text: "text-sky-600" };
  }
  if (dayBookings.some((booking) => booking.endDate === key)) {
    return { label: "Checkout", bg: "bg-amber-50", text: "text-amber-600" };
  }
  if (dayBookings.length > 0) {
    return { label: "Occupied", bg: "bg-rose-50", text: "text-rose-600" };
  }
  if (checkingOutToday && !checkingInToday) {
    return { label: "After 2 PM", bg: "bg-sky-50", text: "text-sky-600" };
  }
  return { label: "Available", bg: "bg-emerald-50", text: "text-emerald-600" };
}
