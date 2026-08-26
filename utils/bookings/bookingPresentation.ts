import type { Availability } from "./bookingCalendar";
import { getBookingStatusLabel } from "./bookingCalendar";
import type { TransientBooking } from "../../types";

export const BOOKING_CALENDAR_LEGEND = [
  {
    label: "Booked",
    markerClassName: "h-1.5 w-2.5 rounded-full bg-info",
  },
  {
    label: "Open",
    markerClassName: "h-1.5 w-1.5 rounded-full bg-success",
  },
  {
    label: "Turnover",
    markerClassName: "h-1.5 w-1.5 rotate-45 rounded-[1px] bg-warning",
  },
  {
    label: "Full",
    markerClassName: "h-1.5 w-1.5 rounded-[1px] bg-danger",
  },
  {
    label: "Cancelled",
    markerClassName: "h-1.5 w-2.5 rounded-full bg-description/30",
  },
] as const;

export function getAvailabilityMarkerClass(availability: Availability) {
  if (availability.label === "Available") {
    return "h-1.5 w-1.5 rounded-full bg-success";
  }
  if (
    availability.label === "After 2 PM" ||
    availability.label === "Checkout"
  ) {
    return "h-1.5 w-1.5 rotate-45 rounded-[1px] bg-warning";
  }

  return "h-1.5 w-1.5 rounded-[1px] bg-danger";
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
