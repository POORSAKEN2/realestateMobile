export type PushTokenPlatform = "ios" | "android" | "web";

export type NotificationModule =
  | "bookings"
  | "leases"
  | "tenants"
  | "properties"
  | "documents"
  | "expenses"
  | "analytics"
  | "settings"
  | "system";

export type PushNotificationData = {
  notificationId?: string;
  type?: string;
  module?: NotificationModule;
  entityId?: string;
  route?: string;
};

export type RegisterPushTokenPayload = {
  token: string;
  platform: PushTokenPlatform;
  deviceName?: string | null;
  appVersion?: string | null;
  projectId?: string | null;
  enabled?: boolean;
};

export type DevicePushToken = {
  id: string;
  token: string;
  platform: PushTokenPlatform;
  deviceName?: string | null;
  appVersion?: string | null;
  projectId?: string | null;
  enabled: boolean;
  lastRegisteredAt?: string | null;
};

export type AppNotificationSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL"
  | "SUCCESS";

export type AppNotification = {
  id: string;
  type?: string | null;
  severity?: AppNotificationSeverity | string | null;
  title: string;
  message: string;
  timestamp?: string | null;
  isRead: boolean;
  actionUrl?: string | null;
  actionLabel?: string | null;
  iconName?: string | null;
  color?: string | null;
  metadata?: Record<string, unknown> | null;
};
