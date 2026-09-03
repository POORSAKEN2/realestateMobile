import { reportAccessDenied } from "../services/access/accessEvents";
import type {
  ApiEnvelope,
  ApiErrorResponse,
  PaginatedApiData,
  RequestOptions,
} from "../types";

export { API_BASE_URL } from "./config";

import { axiosInstance } from "./axios";
import { toApiError, ApiError } from "./errors";
import { getSessionAccess } from "../services/access/sessionAccess";
import { assertRequestAccess, describeRequest, ResourceScopeIndex, scopeResponse } from "../services/access/requestPolicy";
let scopeRevision = -1;
let scopeIndex = new ResourceScopeIndex();

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
  const session = getSessionAccess();
  if (session.revision !== scopeRevision) {
    scopeIndex = new ResourceScopeIndex();
    scopeRevision = session.revision;
  }
  const index = scopeIndex;
  const accessRequest = describeRequest(path, options.method, options.body);
  if (options.access) {
    accessRequest.permission = options.access.permission;
    accessRequest.propertyId = options.access.propertyId ?? accessRequest.propertyId;
  }
  assertRequestAccess(session.access, accessRequest, index);
  const url = path;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = { ...options.headers } as Record<string, any>;
  if (accessRequest.permission && session.token && headers.Authorization && headers.Authorization !== `Bearer ${session.token}`) {
    throw new ApiError("Your account changed. Please try again.", 409, "ACCESS_CHANGED");
  }
  if (session.token && !headers.Authorization) headers.Authorization = `Bearer ${session.token}`;
  if (isFormData) {
    headers["Content-Type"] = undefined;
  }

  try {
    const response = await axiosInstance({
      url,
      method: options.method,
      data: options.body,
      headers,
      signal: options.signal ?? undefined,
    });

    if (getSessionAccess().revision !== session.revision) {
      throw new ApiError("Your account access changed. Please try again.", 409, "ACCESS_CHANGED");
    }
    return scopeResponse(response.data as T, session.access, accessRequest, index);
  } catch (error: any) {
    if (error.response) {
      const data = error.response.data as ApiErrorResponse;
      const failure = toApiError(error.response.status, data);
      if (failure.status === 403 && getSessionAccess().revision === session.revision) reportAccessDenied(failure.message);
      throw failure;
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
