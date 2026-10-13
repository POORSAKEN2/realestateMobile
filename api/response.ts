import {
  ApiError,
  SERVER_ERROR_MESSAGE,
  toApiError,
  toTransportError,
} from "./errors";
import type { ApiErrorResponse } from "../types";

export function getFirstValidationError(errors?: Record<string, unknown>) {
  if (!errors) {
    return undefined;
  }

  const firstError = Object.values(errors)
    .flat()
    .find((value): value is string => typeof value === "string");

  return firstError;
}

export async function parseApiResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const text = await response.text().catch((error) => {
    throw toTransportError(error);
  });
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  let data: ApiErrorResponse | null = null;
  if (text && isJson) {
    try {
      data = JSON.parse(text);
    } catch {
      /* Handled as an invalid response below. */
    }
  }
  const metadata = {
    requestId: response.headers.get("X-Request-ID"),
    retryAfter: response.headers.get("Retry-After"),
  };
  if (!response.ok && !data && text && response.status !== 429) {
    throw new ApiError(
      SERVER_ERROR_MESSAGE,
      response.status,
      "invalid_response",
      undefined,
      metadata,
    );
  }

  if (!response.ok) {
    const validationMessage = getFirstValidationError(data?.errors);

    throw toApiError(
      response.status,
      {
        ...data,
        message:
          data?.message ||
          validationMessage ||
          (response.status === 403 ? undefined : fallbackMessage),
      },
      metadata,
    );
  }

  if (!isJson || data === null || typeof data !== "object") {
    throw new ApiError(
      SERVER_ERROR_MESSAGE,
      response.status,
      "invalid_response",
      undefined,
      metadata,
    );
  }

  return data as T;
}
