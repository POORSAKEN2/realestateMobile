import {
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
} from "../../api/bookings";
import type { TransientBooking } from "../../types";

export type BookingFormMode = "create" | "edit";
export type StatusFilter = "Booked" | "All";

export type BookingFormState = {
  propertyId: string;
  roomNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  startDate: string;
  checkInTime: string;
  endDate: string;
  checkOutTime: string;
  dailyRate: string;
  notes: string;
};

export type Availability = { label: string; bg: string; text: string };
export type BookingPickerField =
  | "startDate"
  | "checkInTime"
  | "endDate"
  | "checkOutTime";

export const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getMonthDays(monthDate: Date) {
  const firstOfMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  );
  const start = addDays(firstOfMonth, -firstOfMonth.getDay());
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();
  const visibleDayCount = Math.max(
    35,
    Math.ceil((firstOfMonth.getDay() + daysInMonth) / 7) * 7,
  );

  return Array.from({ length: visibleDayCount }, (_, index) =>
    addDays(start, index),
  );
}

export function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(value));
}

export function formatDisplayTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

export function getDateRangeLabel(booking: TransientBooking) {
  return `${formatDisplayDate(booking.startDate)} ${formatDisplayTime(booking.checkInTime)} - ${formatDisplayDate(booking.endDate)} ${formatDisplayTime(booking.checkOutTime)}`;
}

export function getDayWindow(day: Date) {
  const key = dateKey(day);
  return { key, start: `${key}T00:00`, end: `${key}T23:59` };
}

export function getBookingStatusLabel(booking: TransientBooking) {
  const today = dateKey(new Date());
  if (booking.status === "Cancelled") return "Cancelled";
  if (booking.startDate > today) return "Upcoming";
  if (booking.startDate === today) return "Checking in today";
  if (booking.endDate === today) return "Checking out today";
  if (booking.endDate < today) return "Completed";
  return "In house";
}

export function getParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function emptyForm(
  propertyId = "",
  date = dateKey(new Date()),
): BookingFormState {
  return {
    propertyId,
    roomNumber: "",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    startDate: date,
    checkInTime: DEFAULT_CHECK_IN_TIME,
    endDate: date,
    checkOutTime: DEFAULT_CHECK_OUT_TIME,
    dailyRate: "",
    notes: "",
  };
}

export function parseMoney(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function isDatePickerField(field: BookingPickerField) {
  return field === "startDate" || field === "endDate";
}

export function getBookingPickerValue(
  form: BookingFormState,
  field: BookingPickerField,
) {
  if (isDatePickerField(field)) {
    return new Date(`${form[field]}T12:00:00`);
  }

  const [hours, minutes] = form[field].split(":").map(Number);
  return new Date(2026, 0, 1, hours || 0, minutes || 0);
}

export function getBookingPickerSelection(
  field: BookingPickerField,
  selectedValue: Date,
) {
  if (isDatePickerField(field)) {
    return { field, value: dateKey(selectedValue) };
  }

  const value = `${String(selectedValue.getHours()).padStart(2, "0")}:${String(
    selectedValue.getMinutes(),
  ).padStart(2, "0")}`;
  return { field, value };
}

export function getBookingPickerChange(
  eventType: string,
  field: BookingPickerField,
  selectedValue?: Date,
) {
  if (eventType === "dismissed" || !selectedValue) return null;
  return getBookingPickerSelection(field, selectedValue);
}

export function getBookingPickerTitle(field: BookingPickerField) {
  switch (field) {
    case "startDate":
      return "Select Check-in Date";
    case "endDate":
      return "Select Check-out Date";
    case "checkInTime":
      return "Select Check-in Time";
    case "checkOutTime":
      return "Select Check-out Time";
  }
}
