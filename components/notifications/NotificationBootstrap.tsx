import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { registerDevicePushToken } from "../../api/notifications";
import { useAuth } from "../../hooks/useAuth";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getRegisterPushTokenPayload,
  openLastNotificationResponse,
} from "../../services/notifications";
import { inquiryKeys } from "../../hooks/api/useInquiries";
import { isInquiryNotification } from "../../utils/inquiries/inquiryNotifications";

export function NotificationBootstrap() {
  const { session, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const subscriptions: Array<{ remove: () => void }> = [];

    function refreshInquiryQueries(
      data: Parameters<typeof isInquiryNotification>[0],
    ) {
      if (!isInquiryNotification(data)) return;
      void queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
    }

    addNotificationResponseListener(refreshInquiryQueries)
      .then((nextSubscription) => {
        if (!isMounted) {
          nextSubscription?.remove();
          return;
        }

        if (nextSubscription) subscriptions.push(nextSubscription);
      })
      .catch(() => {
        // Listener setup should not block the rest of the app.
      });

    addNotificationReceivedListener(refreshInquiryQueries)
      .then((nextSubscription) => {
        if (!isMounted) {
          nextSubscription?.remove();
          return;
        }

        if (nextSubscription) subscriptions.push(nextSubscription);
      })
      .catch(() => {
        // Foreground refresh is best-effort.
      });

    openLastNotificationResponse(refreshInquiryQueries).catch(() => {
      // A stale notification response should never block app startup.
    });

    return () => {
      isMounted = false;
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;
    const accessToken = session?.accessToken;

    async function registerPushToken() {
      if (!isAuthenticated || !accessToken) return;

      try {
        const payload = await getRegisterPushTokenPayload();

        if (!payload || !isMounted) return;

        const registrationKey = `${accessToken}:${payload.token}`;
        if (registeredTokenRef.current === registrationKey) return;

        await registerDevicePushToken(payload, accessToken);
        registeredTokenRef.current = registrationKey;
      } catch (error) {
        console.warn("Push notification registration failed.", error);
      }
    }

    registerPushToken();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, session?.accessToken]);

  return null;
}
