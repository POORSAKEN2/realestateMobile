type TypedNotification = Readonly<{
  type?: string | null;
}>;

const INTERNAL_NOTIFICATION_TYPES = new Set(["SYSTEM_ERROR"]);

export function isUserVisibleNotification(
  notification: TypedNotification,
): boolean {
  const type = notification.type?.trim().toUpperCase();
  return !type || !INTERNAL_NOTIFICATION_TYPES.has(type);
}

export function filterUserVisibleNotifications<T extends TypedNotification>(
  notifications: readonly T[],
): T[] {
  return notifications.filter(isUserVisibleNotification);
}
