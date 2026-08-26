import { getBookingStatusLabel } from "./bookingCalendar";
import type { TransientBooking } from "../../types";

export const BOOKING_CALENDAR_LEGEND = [
  {
    label: "Booked",
    markerClassName: "h-2 w-2 rounded-full bg-secondary",
  },
  {
    label: "Turnover",
    markerClassName: "h-2 w-2 rotate-45 rounded-[1px] bg-turnover",
  },
  {
    label: "Full",
    markerClassName: "h-2 w-2 rounded-[2px] bg-danger",
  },
] as const;

export function getBookingStatusPresentation(booking: TransientBooking) {
  const label = getBookingStatusLabel(booking);

  if (label === "Cancelled") {
    return {
      label,
      backgroundClassName: "bg-muted/15",
      textClassName: "text-description",
    };
  }

  if (label === "Completed") {
    return {
      label,
      backgroundClassName: "bg-surface",
      textClassName: "text-description",
    };
  }

  if (label === "Upcoming") {
    return {
      label,
      backgroundClassName: "bg-textPrimary/10",
      textClassName: "text-textPrimary",
    };
  }

  if (label === "Checking out today") {
    return {
      label,
      backgroundClassName: "bg-warningSurface",
      textClassName: "text-turnover",
    };
  }

  return {
    label,
    backgroundClassName: "bg-successSurface",
    textClassName: "text-success",
  };
}
