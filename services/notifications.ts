import Constants from "expo-constants";
import * as Device from "expo-device";
import { router } from "expo-router";
import { Platform } from "react-native";

import type {
  NotificationModule,
  PushNotificationData,
  PushTokenPlatform,
  RegisterPushTokenPayload,
} from "../types";

type NotificationsModule = typeof import("expo-notifications");

let notificationHandlerConfigured = false;

function isAndroidExpoGo() {
  return Platform.OS === "android" && Constants.appOwnership === "expo";
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === "web" || isAndroidExpoGo()) {
    return null;
  }

  try {
    return await import("expo-notifications");
  } catch (error) {
    console.warn("Expo notifications are unavailable in this runtime.", error);
    return null;
  }
}

async function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;

  const Notifications = await getNotifications();

  if (!Notifications?.setNotificationHandler) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

const MODULE_ROUTES: Record<NotificationModule, string> = {
  bookings: "/bookings",
  leases: "/leases",
  tenants: "/tenants",
  properties: "/properties",
  documents: "/documents",
  expenses: "/expenses",
  analytics: "/analytics",
  settings: "/settings",
  system: "/dashboard",
};

function getProjectId() {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string }; projectId?: string }
    | undefined;

  return (
    Constants.easConfig?.projectId ??
    extra?.eas?.projectId ??
    extra?.projectId ??
    null
  );
}

function getPlatform(): PushTokenPlatform {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

function getNotificationRoute(data?: PushNotificationData) {
  if (data?.route) return data.route;
  if (data?.module) return MODULE_ROUTES[data.module];

  return undefined;
}

export function openNotificationTarget(data?: PushNotificationData) {
  const route = getNotificationRoute(data);

  if (!route) return;

  router.push(route as never);
}

export async function getRegisterPushTokenPayload(): Promise<RegisterPushTokenPayload | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (isAndroidExpoGo()) {
    console.warn(
      "Remote push notifications require a development build on Android. Skipping Expo Go push token registration.",
    );
    return null;
  }

  const Notifications = await getNotifications();

  if (!Notifications?.getExpoPushTokenAsync) {
    return null;
  }

  await configureNotificationHandler();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
    });
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (existingPermissions.status !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getProjectId();
  const tokenResult = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return {
    token: tokenResult.data,
    platform: getPlatform(),
    deviceName: Device.deviceName,
    appVersion: Constants.expoConfig?.version ?? null,
    projectId,
    enabled: true,
  };
}

export async function addNotificationResponseListener() {
  const Notifications = await getNotifications();

  if (!Notifications?.addNotificationResponseReceivedListener) return null;

  await configureNotificationHandler();

  return Notifications.addNotificationResponseReceivedListener((response) => {
    openNotificationTarget(
      response.notification.request.content.data as PushNotificationData,
    );
  });
}

export async function openLastNotificationResponse() {
  const Notifications = await getNotifications();

  if (!Notifications?.getLastNotificationResponseAsync) return;

  const response = await Notifications.getLastNotificationResponseAsync();

  if (!response) return;

  openNotificationTarget(
    response.notification.request.content.data as PushNotificationData,
  );
}
