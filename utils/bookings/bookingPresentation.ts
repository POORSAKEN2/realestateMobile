import type { Availability } from "./bookingCalendar";
import { getBookingStatusLabel } from "./bookingCalendar";
import type { TransientBooking } from "../../types";

export const BOOKING_CALENDAR_LEGEND = [
  { colorClassName: "bg-info", label: "Reservation" },
  { colorClassName: "bg-success", label: "Available" },
  { colorClassName: "bg-warning", label: "Turnover" },
  { colorClassName: "bg-description/20", label: "Cancelled" },
] as const;

export function getAvailabilityDotClass(availability: Availability) {
  if (availability.label === "Available") return "bg-success";
  if (
    availability.label === "After 2 PM" ||
    availability.label === "Checkout"
  ) {
    return "bg-warning";
  }

  return "bg-danger";
}

export function getBookingStatusPresentation(booking: TransientBooking) {
  const label = getBookingStatusLabel(booking);

  if (label === "Cancelled" || label === "Completed") {
    return {
      label,
      backgroundClassName: "bg-surface",
      textClassName: "text-description",
    };
  }

  if (label === "Upcoming") {
    return {
      label,
      backgroundClassName: "bg-infoSurface",
      textClassName: "text-info",
    };
  }

  if (label === "Checking out today") {
    return {
      label,
      backgroundClassName: "bg-warningSurface",
      textClassName: "text-warning",
    };
  }

  return {
    label,
    backgroundClassName: "bg-successSurface",
    textClassName: "text-success",
  };
}
