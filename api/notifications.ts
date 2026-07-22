import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import type {
  AppNotification,
  ApiEnvelope,
  DevicePushToken,
  RegisterPushTokenPayload,
} from "../types";

export type {
  AppNotification,
  AppNotificationSeverity,
  DevicePushToken,
  RegisterPushTokenPayload,
} from "../types";

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

  return unwrapCollection(response);
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
