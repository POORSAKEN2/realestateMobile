import type { EntitlementLimitDetails } from "../types/domain/billing";

export const SERVER_ERROR_MESSAGE =
  "Terrane is temporarily unavailable. Please try again shortly.";
export const NETWORK_ERROR_MESSAGE = "Check your connection and try again.";

export function isTechnicalMessage(value: string): boolean {
  return /SQLSTATE|SQL:\s|permission denied for (?:table|schema|sequence)|(?:Query|PDO|Logic)Exception|Illuminate\\|(?:Connection|Database|Host|Port):|<\/?(?:html|body|!doctype)|stack trace|Calling the ['"].+function has failed/i.test(
    value,
  );
}

type ErrorMetadata = { requestId?: unknown; retryAfter?: string | null };

function requestId(value: unknown): string | undefined {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function retryDelay(value?: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value)
    ? Number(value)
    : (Date.parse(value) - Date.now()) / 1000;
  return Number.isFinite(seconds) ? Math.max(0, Math.ceil(seconds)) : undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  get retryable() {
    return (
      this.status === 0 ||
      this.status >= 500 ||
      this.status === 429 ||
      this.code === "invalid_response"
    );
  }
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>,
    metadata: ErrorMetadata = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId(metadata.requestId);
    this.retryAfterSeconds = retryDelay(metadata.retryAfter);
  }
}
export function isForbiddenError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}
export function entitlementLimitDetails(
  error: unknown,
): EntitlementLimitDetails | null {
  if (
    !(error instanceof ApiError) ||
    error.status !== 403 ||
    error.code !== "entitlement_limit_reached"
  )
    return null;
  const details = error.details;
  if (typeof details?.dimension !== "string") return null;
  return details as unknown as EntitlementLimitDetails;
}

/** Axios preserves the requested binary response type even for JSON errors. */
export function decodeApiErrorPayload(data: unknown): any {
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    try {
      const bytes =
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return undefined;
    }
  }
  return data;
}

export function toApiError(
  status: number,
  payload?: unknown,
  metadata: ErrorMetadata = {},
) {
  const data =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const meta = {
    ...metadata,
    requestId: requestId(data.request_id) ?? metadata.requestId,
  };
  if (status >= 500)
    return new ApiError(
      SERVER_ERROR_MESSAGE,
      status,
      status === 503 ? "service_unavailable" : "server_error",
      undefined,
      meta,
    );
  if (typeof payload === "string" && payload.trim() && status !== 429)
    return new ApiError(
      SERVER_ERROR_MESSAGE,
      status,
      "invalid_response",
      undefined,
      meta,
    );
  const serverMessage =
    typeof data.message === "string" && !isTechnicalMessage(data.message)
      ? data.message
      : undefined;
  const details =
    data.errors &&
    typeof data.errors === "object" &&
    !Array.isArray(data.errors)
      ? (data.errors as Record<string, unknown>)
      : undefined;
  const validation = Object.values(details ?? {})
    .flat()
    .find(
      (value): value is string =>
        typeof value === "string" && !isTechnicalMessage(value),
    );
  if (typeof data.message === "string" && isTechnicalMessage(data.message))
    return new ApiError(
      SERVER_ERROR_MESSAGE,
      status,
      "invalid_response",
      undefined,
      meta,
    );
  const message =
    status === 403
      ? serverMessage &&
        !/^(unauthorized action\.?|forbidden\.?|this action is unauthorized\.?)$/i.test(
          serverMessage,
        )
        ? serverMessage
        : "You don't have permission to do this. Ask your account owner to review your access."
      : status === 429
        ? "Too many attempts. Please try again later."
        : serverMessage ||
          validation ||
          "The request could not be completed. Please try again.";
  const code = data.code ?? data.error;
  return new ApiError(
    message,
    status,
    typeof code === "string" && /^[A-Za-z][A-Za-z0-9_.-]{0,79}$/.test(code)
      ? code
      : undefined,
    details,
    meta,
  );
}

export function toTransportError(error: unknown): unknown {
  if (error instanceof ApiError) return error;
  if (
    error &&
    typeof error === "object" &&
    (("name" in error && error.name === "AbortError") ||
      ("code" in error && error.code === "ERR_CANCELED"))
  )
    return error;
  return new ApiError(NETWORK_ERROR_MESSAGE, 0, "network_error");
}
