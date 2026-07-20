import type { Availability } from "./bookingCalendar";
import { getBookingStatusLabel } from "./bookingCalendar";
import type { TransientBooking } from "../../types";

export const BOOKING_CALENDAR_LEGEND = [
  { colorClassName: "bg-blue-500", label: "Reservation" },
  { colorClassName: "bg-emerald-500", label: "Available" },
  { colorClassName: "bg-amber-500", label: "Turnover" },
  { colorClassName: "bg-slate-300", label: "Cancelled" },
] as const;

export function getAvailabilityDotClass(availability: Availability) {
  if (availability.label === "Available") return "bg-emerald-500";
  if (
    availability.label === "After 2 PM" ||
    availability.label === "Checkout"
  ) {
    return "bg-amber-500";
  }

  return "bg-rose-500";
}

export function getBookingStatusPresentation(booking: TransientBooking) {
  const label = getBookingStatusLabel(booking);

  if (label === "Cancelled" || label === "Completed") {
    return {
      label,
      backgroundClassName: "bg-slate-100",
      textClassName: "text-slate-500",
    };
  }

  if (label === "Upcoming") {
    return {
      label,
      backgroundClassName: "bg-blue-50",
      textClassName: "text-blue-700",
    };
  }

  if (label === "Checking out today") {
    return {
      label,
      backgroundClassName: "bg-amber-50",
      textClassName: "text-amber-700",
    };
  }

  return {
    label,
    backgroundClassName: "bg-emerald-50",
    textClassName: "text-emerald-700",
  };
}
