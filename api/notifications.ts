import { apiClient } from "./client";
import type {
  AppNotification,
  ApiEnvelope,
  DevicePushToken,
  PaginatedApiData,
  RegisterPushTokenPayload,
} from "../types";

export type {
  AppNotification,
  AppNotificationSeverity,
  DevicePushToken,
  RegisterPushTokenPayload,
} from "../types";

function authHeaders(accessToken?: string) {
  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function unwrapData<T>(response: ApiEnvelope<T> | T): T {
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

function normalizeCollection<T>(
  payload: ApiEnvelope<T[]> | ApiEnvelope<PaginatedApiData<T>> | T[],
): T[] {
  const data =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
      ? payload.data
      : payload;

  if (Array.isArray(data)) {
    return data;
  }

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

function toPushTokenApiPayload(payload: RegisterPushTokenPayload) {
  return {
    token: payload.token,
    platform: payload.platform,
    device_name: payload.deviceName,
    app_version: payload.appVersion,
    project_id: payload.projectId,
    enabled: payload.enabled ?? true,
  };
}

export async function registerDevicePushToken(
  payload: RegisterPushTokenPayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<DevicePushToken> | DevicePushToken
  >("/push-tokens", toPushTokenApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return unwrapData(response);
}

export async function disableDevicePushToken(
  token: string,
  accessToken?: string,
) {
  await apiClient.delete<void>("/push-tokens", {
    headers: {
      ...authHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
}

export async function fetchNotifications(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<AppNotification[]> | AppNotification[]
  >("/notifications", { headers: authHeaders(accessToken) });

  return normalizeCollection(response);
}

export async function markNotificationRead(
  notificationId: string,
  accessToken?: string,
) {
  const response = await apiClient.patch<
    ApiEnvelope<AppNotification> | AppNotification
  >(`/notifications/${notificationId}/read`, undefined, {
    headers: authHeaders(accessToken),
  });

  return unwrapData(response);
}

export async function markAllNotificationsRead(accessToken?: string) {
  await apiClient.post<void>("/notifications/read-all", undefined, {
    headers: authHeaders(accessToken),
  });
}
