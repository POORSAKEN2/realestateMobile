import Constants from "expo-constants";
import type { ApiErrorResponse, RequestOptions } from "../types";

const extra = Constants.expoConfig?.extra as
  | { apiBaseUrl?: string }
  | undefined;

export const API_BASE_URL =
  extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.VITE_API_BASE_URL ??
  "";

import { axiosInstance } from "./axios";

function getFirstValidationError(errors?: Record<string, string[]>) {
  if (!errors) return undefined;
  const [firstError] = Object.values(errors).flat();
  return firstError;
}

async function request<T>(
  path: string,
  options: RequestOptions & { method: string; body?: unknown } = { method: "GET" },
): Promise<T> {
  const url = path;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
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
        data?.message || validationMessage || `API request failed with status ${error.response.status}`
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
