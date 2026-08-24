import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/notifications";
import { Screen } from "../../components/ui/Screen";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import {
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import { colors } from "../../constants/colors";
import { resolveModuleRoute } from "../../constants/navigation";
import { useAuth } from "../../hooks/useAuth";
import type { AppNotification } from "../../types";

const severityStyles = {
  SUCCESS: {
    bg: "#ECFDF5",
    text: "#047857",
    icon: "checkmark-circle" as const,
  },
  WARNING: {
    bg: "#FFFBEB",
    text: "#B45309",
    icon: "warning" as const,
  },
  CRITICAL: {
    bg: "#FEF2F2",
    text: "#DC2626",
    icon: "alert-circle" as const,
  },
  INFO: {
    bg: "#EFF6FF",
    text: colors.primary,
    icon: "information-circle" as const,
  },
};

function getSeverityStyle(severity?: string | null) {
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

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
        <Ionicons
          name="notifications-outline"
          size={30}
          color={colors.primary}
        />
      </View>
      <Text className="text-center font-ralewayBold text-xl text-[#1d1d1f]">
        No notifications yet
      </Text>
      <Text className="mt-2 text-center text-sm leading-6 text-[#6F6D6D]">
        Portfolio updates, booking changes, and system alerts will appear here.
      </Text>
      <TouchableOpacity
        activeOpacity={0.82}
        className="mt-6 rounded-full bg-[#2563EB] px-5 py-3"
        onPress={onRefresh}
      >
        <Text className="font-ralewayBold text-sm text-white">Refresh</Text>
      </TouchableOpacity>
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
  const style = getSeverityStyle(notification.severity);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      accessibilityRole="button"
      className={`mb-3 rounded-[24px] border p-4 ${
        notification.isRead
          ? "border-[#E2E8F0] bg-white"
          : "border-[#BFDBFE] bg-[#F8FBFF]"
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
              className="min-w-0 flex-1 font-ralewayBold text-[15px] text-[#1d1d1f]"
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            {!notification.isRead ? (
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2563EB]" />
            ) : null}
          </View>

          <Text
            className="mt-1 text-sm leading-5 text-[#6F6D6D]"
            numberOfLines={3}
          >
            {notification.message}
          </Text>

          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text className="font-ralewayBold text-xs text-[#94A3B8]">
              {formatTimestamp(notification.timestamp)}
            </Text>
            {notification.actionUrl ? (
              <View className="flex-row items-center gap-1">
                <Text className="font-ralewayBold text-xs text-[#2563EB]">
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
  const { session, isAuthenticated } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const queryKey = ["notifications", accessToken];
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(accessToken),
    enabled: isAuthenticated && !!accessToken,
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

    const targetRoute = resolveModuleRoute(notification.actionUrl);

    if (targetRoute) {
      router.push(targetRoute);
    }
  }

  const isInitialLoading =
    notificationsQuery.isLoading && notifications.length === 0;

  async function refreshNotifications() {
    setIsRefreshing(true);
    try {
      await notificationsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Screen className="bg-[#F8FAFC]">
      <View className="mb-5">
        <ModuleHeader
          action={
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              className={`h-11 w-11 items-center justify-center rounded-full border ${
                unreadCount > 0
                  ? "border-primary/25 bg-primary/10"
                  : "border-accent bg-whitePrimary"
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
                  color={unreadCount > 0 ? colors.primary : colors.description}
                />
              )}
            </TouchableOpacity>
          }
          eyebrow="Activity Center"
          leading={
            <SecondaryBackButton accessibilityLabel="Back from notifications" />
          }
          supportingText={
            isInitialLoading
              ? "Loading activity"
              : unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up"
          }
          title="Notifications"
        />
      </View>

      {notificationsQuery.isError ? (
        <View className="rounded-[24px] border border-rose-100 bg-rose-50 p-4">
          <Text className="font-ralewayBold text-rose-700">
            Could not load notifications
          </Text>
          <Text className="mt-1 text-sm leading-5 text-rose-600">
            {notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : "Please try again."}
          </Text>
        </View>
      ) : null}

      {isInitialLoading ? (
        <SkeletonGroup
          accessibilityLabel="Loading notifications"
          className="flex-1 gap-3"
        >
          <SkeletonList
            count={4}
            renderItem={() => <SkeletonListCard className="min-h-28" />}
          />
        </SkeletonGroup>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 118,
          }}
          ListEmptyComponent={
            <EmptyState onRefresh={() => void refreshNotifications()} />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={colors.primary}
              onRefresh={refreshNotifications}
            />
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={handleNotificationPress}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
