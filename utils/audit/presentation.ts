import type { AuditFilters } from "../../types/domain/audit";
import { formatDate, formatDateTime } from "../formatters";

export function auditLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function auditValue(value: unknown): string {
  if (value == null) return "Unavailable";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value) && value.every((item) => typeof item === "string"))
    return value.length ? value.join("\n") : "None";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function auditDate(
  value: string | null | undefined,
  includeTime = false,
): string {
  if (!value) return "Unavailable";
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value,
  );
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return includeTime ? formatDateTime(date) : formatDate(date);
}

export function auditStoragePolicyNotice(
  policy: "append_only" | undefined,
): string | null {
  return policy === "append_only"
    ? "Audit entries are append-only. Existing events cannot be edited or deleted."
    : null;
}

export function localAuditDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function normalizeAuditFilters(filters: AuditFilters): AuditFilters {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value?.trim()])
      .filter(([, value]) => value),
  );
}

export function auditFilterErrors(
  filters: AuditFilters,
): Partial<Record<keyof AuditFilters, string>> {
  const errors: Partial<Record<keyof AuditFilters, string>> = {};
  const values = normalizeAuditFilters(filters);
  for (const key of ["actor_id", "property_id"] as const) {
    if (
      values[key] &&
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        values[key]!,
      )
    )
      errors[key] = "Enter a complete ID from an audit event.";
  }
  for (const key of ["start_date", "end_date"] as const) {
    const value = values[key];
    if (!value) continue;
    const date = new Date(`${value}T12:00:00`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      localAuditDate(date) !== value
    )
      errors[key] = "Choose a valid date.";
  }
  if (
    !errors.start_date &&
    !errors.end_date &&
    values.start_date &&
    values.end_date &&
    values.end_date < values.start_date
  )
    errors.end_date = "To date must be on or after From date.";
  return errors;
}
