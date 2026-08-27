import type { Bedspace, BedspacePayload, BedspaceStatus } from "../../types";

export type BedspaceFormState = {
  bedspaceNumber: string;
  monthlyPrice: string;
  notes: string;
  status: BedspaceStatus;
};

export type BedspaceFormResult =
  | { isValid: true; payload: BedspacePayload }
  | { isValid: false; error: string };

export function createEmptyBedspaceForm(): BedspaceFormState {
  return {
    bedspaceNumber: "",
    monthlyPrice: "",
    notes: "",
    status: "Vacant",
  };
}

export function createBedspaceForm(bedspace: Bedspace): BedspaceFormState {
  return {
    bedspaceNumber: bedspace.bedspaceNumber,
    monthlyPrice: String(bedspace.monthlyPrice),
    notes: bedspace.notes ?? "",
    status: bedspace.status,
  };
}

export function getBedspaceFormResult(
  form: BedspaceFormState,
): BedspaceFormResult {
  const bedspaceNumber = form.bedspaceNumber.trim();
  if (!bedspaceNumber) {
    return { isValid: false, error: "Bedspace number is required." };
  }
  if (bedspaceNumber.length > 255) {
    return {
      isValid: false,
      error: "Bedspace number must not exceed 255 characters.",
    };
  }

  const monthlyPrice = Number(form.monthlyPrice);
  if (!form.monthlyPrice.trim() || !Number.isFinite(monthlyPrice)) {
    return { isValid: false, error: "Enter a valid monthly price." };
  }
  if (monthlyPrice < 0) {
    return { isValid: false, error: "Monthly price cannot be negative." };
  }

  return {
    isValid: true,
    payload: {
      bedspaceNumber,
      monthlyPrice,
      notes: form.notes.trim() || null,
      ...(form.status === "Occupied" ? {} : { status: form.status }),
    },
  };
}
