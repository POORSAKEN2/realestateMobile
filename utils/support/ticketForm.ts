import { ApiError } from "../../api/errors";
import type {
  CreateSupportTicketPayload,
  TicketCategory,
} from "../../types/domain/support";

export const TICKET_CATEGORIES: TicketCategory[] = [
  "Technical",
  "Billing",
  "Maintenance",
  "General",
];
export type TicketFieldErrors = Partial<
  Record<keyof CreateSupportTicketPayload, string>
>;

export function validateTicket(
  payload: CreateSupportTicketPayload,
): TicketFieldErrors {
  const errors: TicketFieldErrors = {};
  if (!payload.subject.trim()) errors.subject = "Enter a subject.";
  else if ([...payload.subject.trim()].length > 255)
    errors.subject = "Use 255 characters or fewer.";
  if (!payload.description.trim()) errors.description = "Describe your issue.";
  if (!TICKET_CATEGORIES.includes(payload.category))
    errors.category = "Select a category.";
  if (!["Low", "Medium", "High", "Urgent"].includes(payload.priority))
    errors.priority = "Select a priority.";
  return errors;
}

export function ticketSubmissionError(error: unknown): {
  fields: TicketFieldErrors;
  message: string | null;
} {
  const fields: TicketFieldErrors = {};
  if (error instanceof ApiError && error.status === 422) {
    for (const field of [
      "subject",
      "description",
      "category",
      "priority",
    ] as const) {
      const value = error.details?.[field];
      const message = Array.isArray(value)
        ? value.find((item) => typeof item === "string")
        : value;
      if (typeof message === "string") fields[field] = message;
    }
    if (Object.keys(fields).length) return { fields, message: null };
  }
  return {
    fields,
    message:
      error instanceof Error
        ? error.message
        : "Could not submit ticket. Try again.",
  };
}
