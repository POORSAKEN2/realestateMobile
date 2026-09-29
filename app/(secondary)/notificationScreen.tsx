import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notifications";
import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { Screen } from "../../components/ui/Screen";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import {
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { formatLocalizedDate } from "../../utils/formatters";
import { resolveModuleRoute } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import type { AppNotification } from "../../types";
import { openModuleRoute } from "../../utils/navigation/moduleNavigation";
import {
  inquiryNotificationRoute,
  isInquiryNotification,
} from "../../utils/inquiries/inquiryNotifications";
import { inquiryKeys } from "../../hooks/api/useInquiries";
import { usePlanCapability } from "../../hooks/billing/usePlanCapability";
import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";

function getSeverityStyle(
  severity: string | null | undefined,
  colors: ReturnType<typeof useThemeColors>,
) {
  const severityStyles = {
    SUCCESS: {
      bg: colors.successSurface,
      text: colors.success,
      icon: "checkmark-circle" as const,
    },
    WARNING: {
      bg: colors.warningSurface,
      text: colors.warning,
      icon: "warning" as const,
    },
    CRITICAL: {
      bg: colors.dangerSurface,
      text: colors.danger,
      icon: "alert-circle" as const,
    },
    INFO: {
      bg: `${colors.primary}1A`,
      text: colors.primary,
      icon: "information-circle" as const,
    },
  };
  const key = severity?.toUpperCase() as keyof typeof severityStyles;

  return severityStyles[key] ?? severityStyles.INFO;
}

function formatTimestamp(value?: string | null) {
  if (!value) return "Just now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";

  return formatLocalizedDate(date, {
    month: "short",
    day: "numeric",
  });
}

function EmptyState({
  onRefresh,
  refreshing,
  failed,
}: {
  onRefresh: () => void;
  refreshing: boolean;
  failed: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 justify-center py-6">
      <View
        className="items-center rounded-[28px] border border-primary/15 bg-panel px-6 py-8"
        style={{ width: "100%", maxWidth: 440, alignSelf: "center" }}
      >
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-[32px] border border-primary/20 bg-primary/10">
          <Ionicons
            name={failed ? "cloud-offline-outline" : "notifications-outline"}
            size={40}
            color={colors.primary}
          />
        </View>
        <Text
          accessibilityRole="header"
          className="text-center font-ralewayExtraBold text-[22px] text-textPrimary"
        >
          {failed ? "Updates couldn't load" : "A quiet moment"}
        </Text>
        <Text
          className="mt-3 text-center text-sm leading-6 text-description"
          style={{ maxWidth: 300 }}
        >
          {failed
            ? "Check your connection and try again to see your latest notifications."
            : "No notifications yet. Property updates, booking changes and inquiry alerts will appear here."}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            failed ? "Retry loading notifications" : "Refresh notifications"
          }
          accessibilityState={{ disabled: refreshing, busy: refreshing }}
          activeOpacity={0.82}
          className="mt-6 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-6 py-3"
          disabled={refreshing}
          onPress={onRefresh}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons name="refresh-outline" color={colors.primary} size={18} />
          )}
          <Text className="font-ralewayBold text-sm text-textPrimary">
            {refreshing
              ? "Checking for updates…"
              : failed
                ? "Try again"
                : "Check for updates"}
          </Text>
        </TouchableOpacity>
        {!failed ? (
          <Text className="mt-4 text-center text-xs text-description">
            You can also pull down to refresh.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}) {
  const colors = useThemeColors();
  const style = getSeverityStyle(notification.severity, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${notification.isRead ? "Read" : "Unread"}. ${notification.title}. ${notification.message}`}
      className={`mb-3 rounded-[24px] border p-4 ${
        notification.isRead
          ? "border-primary/10 bg-panel"
          : "border-primary/30 bg-primary/10"
      }`}
      onPress={() => onPress(notification)}
    >
      <View className="flex-row gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: style.bg }}
        >
          <Ionicons name={style.icon} size={22} color={style.text} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start gap-2">
            <Text
              className="min-w-0 flex-1 font-ralewayBold text-[15px] text-textPrimary"
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            {!notification.isRead ? (
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
            ) : null}
          </View>

          <Text
            className="mt-1 text-sm leading-5 text-description"
            numberOfLines={3}
          >
            {notification.message}
          </Text>

          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text className="font-ralewayBold text-xs text-description">
              {formatTimestamp(notification.timestamp)}
            </Text>
            {notification.actionUrl ? (
              <View className="flex-row items-center gap-1">
                <Text className="font-ralewayBold text-xs text-textPrimary">
                  {notification.actionLabel || "Open"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.primary}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationScreen() {
  const colors = useThemeColors();
  const { session, isAuthenticated } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const [isUpgradeVisible, setUpgradeVisible] = useState(false);
  const notificationAccess = usePlanCapability("notifications", {
    enabled: isAuthenticated,
  });
  const queryKey = ["notifications", accessToken];

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(accessToken),
    enabled: isAuthenticated && !!accessToken && notificationAccess.hasAccess,
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId, accessToken),
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<AppNotification[]>(queryKey, (current = []) =>
        current.map((notification) =>
          notification.id === updatedNotification.id
            ? updatedNotification
            : notification,
        ),
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(accessToken),
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(queryKey, (current = []) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
    },
  });

  function handleNotificationPress(notification: AppNotification) {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    const rawEntityId =
      notification.metadata?.entityId ?? notification.metadata?.entity_id;
    const entityId =
      typeof rawEntityId === "string" || typeof rawEntityId === "number"
        ? String(rawEntityId)
        : undefined;
    const inquiryData = {
      entityId,
      route: notification.actionUrl,
      type: notification.type,
    };
    if (isInquiryNotification(inquiryData)) {
      void queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
    }
    const targetRoute = resolveModuleRoute(
      inquiryNotificationRoute(inquiryData) ?? notification.actionUrl,
    );

    if (targetRoute) {
      openModuleRoute(targetRoute);
    }
  }

  const isInitialLoading =
    notificationsQuery.isLoading && notifications.length === 0;

  async function refreshNotifications() {
    await notificationsQuery.refetch();
  }

  return (
    <Screen className="bg-surface" bottomInset="safe-area">
      <View className="mb-5">
        <ModuleHeader
          action={
            notificationAccess.hasAccess && unreadCount > 0 ? (
              <TouchableOpacity
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                accessibilityState={{
                  disabled: markAllReadMutation.isPending,
                  busy: markAllReadMutation.isPending,
                }}
                className={`h-11 w-11 items-center justify-center rounded-full border ${
                  unreadCount > 0
                    ? "border-primary/25 bg-primary/10"
                    : "border-accent bg-panel"
                }`}
                disabled={unreadCount === 0 || markAllReadMutation.isPending}
                onPress={() => markAllReadMutation.mutate()}
              >
                {markAllReadMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="checkmark-done"
                    size={21}
                    color={
                      unreadCount > 0 ? colors.primary : colors.description
                    }
                  />
                )}
              </TouchableOpacity>
            ) : undefined
          }
          eyebrow="Account"
          leading={
            <SecondaryBackButton accessibilityLabel="Back from notifications" />
          }
          supportingText={
            notificationAccess.isLoading
              ? "Checking plan access"
              : !notificationAccess.hasAccess
                ? "Account access unavailable"
                : isInitialLoading
                  ? "Loading activity"
                  : notificationsQuery.isError && !notificationsQuery.data
                    ? "Updates temporarily unavailable"
                    : unreadCount > 0
                      ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                      : notifications.length > 0
                        ? "You're all caught up"
                        : "Your latest updates, in one place"
          }
          title="Notifications"
        />
      </View>

      {!notificationAccess.isLoading && !notificationAccess.hasAccess ? (
        <View className="flex-1 items-center justify-center px-8 py-20">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Ionicons
              name="lock-closed-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text className="text-center font-ralewayBold text-xl text-textPrimary">
            Notification access unavailable
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-description">
            Review your account access to load portfolio and inquiry
            notifications.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            className="mt-6 rounded-full bg-primary px-5 py-3"
            onPress={() => setUpgradeVisible(true)}
          >
            <Text className="font-ralewayBold text-sm text-white">
              View plans
            </Text>
          </TouchableOpacity>
        </View>
      ) : notificationsQuery.isError && notifications.length > 0 ? (
        <View className="rounded-[24px] border border-danger/20 bg-dangerSurface p-4">
          <Text className="font-ralewayBold text-danger">
            Could not load notifications
          </Text>
          <Text className="mt-1 text-sm leading-5 text-danger">
            {notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : "Please try again."}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: notificationsQuery.isFetching }}
            disabled={notificationsQuery.isFetching}
            className="mt-2 min-h-11 justify-center"
            onPress={() => void refreshNotifications()}
          >
            <Text className="font-ralewayBold text-danger">
              {notificationsQuery.isFetching ? "Retrying…" : "Retry refresh"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {notificationAccess.hasAccess &&
      (markReadMutation.isError || markAllReadMutation.isError) ? (
        <View
          accessibilityRole="alert"
          className="mb-3 rounded-2xl border border-danger/20 bg-dangerSurface p-4"
        >
          <Text className="text-sm text-danger">
            Couldn't mark notifications as read. Please try again.
          </Text>
        </View>
      ) : null}

      {notificationAccess.isLoading ||
      (notificationAccess.hasAccess && isInitialLoading) ? (
        <SkeletonGroup
          accessibilityLabel="Loading notifications"
          className="flex-1 gap-3"
        >
          <SkeletonList
            count={4}
            renderItem={() => <SkeletonListCard className="min-h-28" />}
          />
        </SkeletonGroup>
      ) : notificationAccess.hasAccess ? (
        <PullToRefreshFlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 16,
          }}
          ListEmptyComponent={
            <EmptyState
              refreshing={notificationsQuery.isFetching}
              failed={notificationsQuery.isError}
              onRefresh={() => void refreshNotifications()}
            />
          }
          onRefresh={refreshNotifications}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={handleNotificationPress}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      <UpgradePlanModal
        isVisible={isUpgradeVisible}
        message="Review your account's subscription access."
        onClose={() => setUpgradeVisible(false)}
        requiredTier={notificationAccess.requiredTier}
      />
    </Screen>
  );
}
