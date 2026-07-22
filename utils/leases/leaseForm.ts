import type { Lease, LeasePayload } from "../../types";

const DEFAULT_DURATION_MONTHS = 12;

export type LeaseFormState = {
  propertyId: string;
  lesseeId: string;
  startDate: string;
  durationMonths: string;
  monthlyRent: string;
  roomNumber: string;
  status: string;
};

export type LeaseFormResult =
  | { isValid: true; payload: LeasePayload }
  | { isValid: false; error: string };

function getValidLeaseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

export function formatLeaseDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLeaseDateValue(value: string) {
  return getValidLeaseDate(value) ?? new Date();
}

export function formatLeaseDateLabel(value: string) {
  if (!value) return "";

  return parseLeaseDateValue(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calculateLeaseEndDate(startDate: string, months: number) {
  if (!startDate || !Number.isInteger(months) || months < 1) return "";

  const sourceDate = getValidLeaseDate(startDate);
  if (!sourceDate) return "";

  const year = sourceDate.getFullYear();
  const month = sourceDate.getMonth() + 1;
  const day = sourceDate.getDate();

  const targetMonth = month - 1 + months;
  const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();

  return formatLeaseDateValue(
    new Date(year, targetMonth, Math.min(day, lastDayOfTargetMonth)),
  );
}

export function calculateLeaseDurationMonths(
  startDate: string,
  endDate: string,
) {
  if (!startDate || !endDate) return DEFAULT_DURATION_MONTHS;

  const start = getValidLeaseDate(startDate);
  const end = getValidLeaseDate(endDate);
  if (!start || !end) return DEFAULT_DURATION_MONTHS;
  const years = end.getFullYear() - start.getFullYear();
  const months = end.getMonth() - start.getMonth() + years * 12;

  return Math.max(months, 1);
}

export function createEmptyLeaseForm(): LeaseFormState {
  return {
    propertyId: "",
    lesseeId: "",
    startDate: formatLeaseDateValue(new Date()),
    durationMonths: String(DEFAULT_DURATION_MONTHS),
    monthlyRent: "",
    roomNumber: "",
    status: "Active",
  };
}

export function createLeaseForm(lease: Lease): LeaseFormState {
  return {
    propertyId: lease.propertyId,
    lesseeId: lease.lesseeId,
    startDate: lease.startDate,
    durationMonths: String(
      calculateLeaseDurationMonths(lease.startDate, lease.endDate),
    ),
    monthlyRent: String(lease.monthlyRent || ""),
    roomNumber: lease.roomNumber ?? "",
    status: lease.status || "Active",
  };
}

export function getLeaseFormResult(form: LeaseFormState): LeaseFormResult {
  if (!form.propertyId) {
    return { isValid: false, error: "Please select a property." };
  }

  if (!form.lesseeId) {
    return { isValid: false, error: "Please select a tenant." };
  }

  if (!form.startDate) {
    return { isValid: false, error: "Start date is required." };
  }

  if (!getValidLeaseDate(form.startDate)) {
    return { isValid: false, error: "Please select a valid start date." };
  }

  const durationMonths = Number.parseInt(form.durationMonths, 10);
  if (Number.isNaN(durationMonths) || durationMonths < 1) {
    return {
      isValid: false,
      error: "Lease duration must be at least 1 month.",
    };
  }

  const monthlyRent = Number(form.monthlyRent || 0);
  if (Number.isNaN(monthlyRent) || monthlyRent <= 0) {
    return {
      isValid: false,
      error: "Monthly rent must be a valid amount greater than 0.",
    };
  }

  const endDate = calculateLeaseEndDate(form.startDate, durationMonths);

  return {
    isValid: true,
    payload: {
      propertyId: form.propertyId,
      lesseeId: form.lesseeId,
      startDate: form.startDate,
      endDate,
      monthlyRent,
      roomNumber: form.roomNumber.trim(),
      status: form.status,
    },
  };
}
