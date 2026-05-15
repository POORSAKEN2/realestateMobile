import { useEffect, useRef } from "react";

import { registerDevicePushToken } from "../../api/notifications";
import { useAuth } from "../../hooks/useAuth";
import {
  addNotificationResponseListener,
  getRegisterPushTokenPayload,
  openLastNotificationResponse,
} from "../../services/notifications";

export function NotificationBootstrap() {
  const { session, isAuthenticated } = useAuth();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    addNotificationResponseListener()
      .then((nextSubscription) => {
        if (!isMounted) {
          nextSubscription?.remove();
          return;
        }

        subscription = nextSubscription;
      })
      .catch(() => {
        // Listener setup should not block the rest of the app.
      });

    openLastNotificationResponse().catch(() => {
      // A stale notification response should never block app startup.
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

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
