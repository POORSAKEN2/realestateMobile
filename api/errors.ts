import type { EntitlementLimitDetails } from "../types/domain/billing";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
export function isForbiddenError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}
export function entitlementLimitDetails(error: unknown): EntitlementLimitDetails | null {
  if (!(error instanceof ApiError) || error.status !== 403 || error.code !== "entitlement_limit_reached") return null;
  const details = error.details;
  if (typeof details?.dimension !== "string") return null;
  return details as unknown as EntitlementLimitDetails;
}

export function toApiError(status: number, data?: { message?: string; code?: string; error?: string; errors?: Record<string, unknown> }) {
  const serverMessage = data?.message;
  const message = status === 403
    ? serverMessage && !/^(unauthorized action\.?|forbidden\.?|this action is unauthorized\.?)$/i.test(serverMessage)
      ? serverMessage : "You don't have permission to do this. Ask your account owner to review your access."
    : serverMessage || Object.values(data?.errors ?? {}).flat().find((value): value is string => typeof value === "string") || `API request failed with status ${status}`;
  return new ApiError(message, status, data?.code ?? data?.error, data?.errors);
}
