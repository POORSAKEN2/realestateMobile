import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { useAuth } from "../../hooks/useAuth";
import { appleMapsTokenManager } from "../../services/maps/appleMapsTokenManager";

const PREFETCH_RETRY_DELAY_MS = 60 * 1000;
const MINIMUM_TIMER_DELAY_MS = 1000;

export function AppleMapsTokenBootstrap() {
  const { isAuthenticated, session } = useAuth();
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    if (!isAuthenticated || !accessToken) {
      appleMapsTokenManager.clear();
      return;
    }

    const authenticatedAccessToken = accessToken;
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    function clearRefreshTimer() {
      if (!refreshTimer) return;
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    function scheduleRefresh() {
      if (cancelled) return;

      clearRefreshTimer();
      const delay = appleMapsTokenManager.getRefreshDelayMs(
        authenticatedAccessToken,
      );
      if (delay === null) return;

      refreshTimer = setTimeout(
        () => void refreshToken(true),
        Math.max(delay, MINIMUM_TIMER_DELAY_MS),
      );
    }

    function scheduleRetry() {
      if (cancelled) return;

      clearRefreshTimer();
      refreshTimer = setTimeout(
        () => void refreshToken(false),
        PREFETCH_RETRY_DELAY_MS,
      );
    }

    async function refreshToken(forceRefresh: boolean) {
      try {
        await appleMapsTokenManager.getToken(authenticatedAccessToken, {
          forceRefresh,
        });
        scheduleRefresh();
      } catch {
        // Map UI owns user-facing errors. Bootstrap retries silently.
        scheduleRetry();
      }
    }

    void refreshToken(false);

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") void refreshToken(false);
      },
    );

    return () => {
      cancelled = true;
      clearRefreshTimer();
      appStateSubscription.remove();
    };
  }, [accessToken, isAuthenticated]);

  return null;
}
