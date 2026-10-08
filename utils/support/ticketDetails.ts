import { ApiError } from "../../api/errors";
import { formatDateTime } from "../formatters";

export function isTicketUnavailable(error: unknown) {
  return (
    error instanceof ApiError && (error.status === 403 || error.status === 404)
  );
}

export function ticketTimestamp(value?: string) {
  return value && !Number.isNaN(new Date(value).getTime())
    ? formatDateTime(value)
    : "Unavailable";
}

export function ticketStatusClass(status: string) {
  switch (status) {
    case "Open":
      return "bg-warningSurface text-warning";
    case "In Progress":
      return "bg-infoSurface text-info";
    case "Resolved":
    case "Closed":
      return "bg-successSurface text-success";
    default:
      return "bg-surface text-textPrimary";
  }
}
