import type { WorkspaceSettings } from "../types/domain/workspaceSettings";

type PresentationSettings = Pick<WorkspaceSettings, "currency" | "locale" | "dateFormat">;
let presentation: PresentationSettings = { currency: "PHP", locale: "en-PH", dateFormat: "MM/DD/YYYY" };

export function setPresentationSettings(settings: PresentationSettings) {
  presentation = settings;
}

export function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(presentation.locale, {
    style: "currency",
    currency: presentation.currency,
    maximumFractionDigits,
  }).format(Number(value) || 0);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat(presentation.locale, {
    style: "currency", currency: presentation.currency, notation: "compact", maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(presentation.locale, { maximumFractionDigits }).format(Number(value) || 0);
}

function dateParts(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { DD: String(date.getDate()).padStart(2, "0"), MM: String(date.getMonth() + 1).padStart(2, "0"), YYYY: String(date.getFullYear()), date };
}

export function formatDate(value: string | number | Date) {
  const parts = dateParts(value);
  if (!parts) return "—";
  return presentation.dateFormat.replace(/YYYY|MM|DD/g, token => parts[token as "YYYY" | "MM" | "DD"]);
}

export function formatDateTime(value: string | number | Date) {
  const parts = dateParts(value);
  if (!parts) return "—";
  const time = new Intl.DateTimeFormat(presentation.locale, { hour: "numeric", minute: "2-digit" }).format(parts.date);
  return `${formatDate(parts.date)} ${time}`;
}

export function formatLocalizedDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions,
) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(presentation.locale, options).format(date);
}
