import { Expense } from "../../types/domain/expenses";

export type FormState = {
  propertyId: string;
  category: string;
  amount: string;
  date: string;
  referenceNumber: string;
  description: string;
  status: Expense["status"];
};

export const emptyForm: FormState = {
  propertyId: "",
  category: "",
  amount: "",
  date: "",
  status: "Pending",
  referenceNumber: "",
  description: "",
};

export function formatPeso(value = 0) {
  if (value >= 1_000_000_000)
    return `PHP ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  return `PHP ${value.toLocaleString()}`;
}
export function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
export function cleanDecimal(value: string, allowNegative = false) {
  let cleaned = value.replace(/[^\d.,-]/g, "");
  cleaned = allowNegative
    ? cleaned.replace(/(?!^)-/g, "")
    : cleaned.replace(/-/g, "");
  const [firstPart, ...otherParts] = cleaned.split(".");
  return [firstPart, otherParts.join("")].filter(Boolean).join(".");
}

export function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateValue(value: string) {
  const parsed = value ? new Date(`${value}T12:00:00`) : new Date();

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
