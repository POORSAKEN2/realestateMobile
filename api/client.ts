import type {
  ApiEnvelope,
  ApiErrorResponse,
  PaginatedApiData,
  RequestOptions,
} from "../types";

export { API_BASE_URL } from "./config";

import { axiosInstance } from "./axios";
import { getFirstValidationError } from "./response";

export function authHeaders(accessToken?: string) {
  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export function unwrapData<T>(response: ApiEnvelope<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

export function unwrapCollection<T>(
  payload: ApiEnvelope<T[]> | ApiEnvelope<PaginatedApiData<T>> | T[],
): T[] {
  const data =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
      ? payload.data
      : payload;

  if (Array.isArray(data)) return data;

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as PaginatedApiData<T>).data)
  ) {
    return (data as PaginatedApiData<T>).data ?? [];
  }

  return [];
}

async function request<T>(
  path: string,
  options: RequestOptions & { method: string; body?: unknown } = {
    method: "GET",
  },
): Promise<T> {
  const url = path;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = { ...options.headers } as Record<string, any>;
  if (isFormData) {
    headers["Content-Type"] = undefined;
  }

  try {
    const response = await axiosInstance({
      url,
      method: options.method,
      data: options.body,
      headers,
    });

    return response.data as T;
  } catch (error: any) {
    if (error.response) {
      const data = error.response.data as ApiErrorResponse;
      const validationMessage = getFirstValidationError(data?.errors);

      throw new Error(
        data?.message ||
          validationMessage ||
          `API request failed with status ${error.response.status}`,
      );
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
