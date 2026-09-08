import { useEffect, useRef } from "react";
import { Alert } from "react-native";

import { useAuth } from "../../hooks/useAuth";
import { subscribeAccessDenied } from "../../services/access/accessEvents";

const DUPLICATE_WINDOW_MS = 1_500;

export function AccessDeniedPrompt() {
  const { signOut } = useAuth();
  const lastNotice = useRef({ message: "", shownAt: 0 });

  useEffect(
    () =>
      subscribeAccessDenied((message) => {
        const now = Date.now();
        if (
          lastNotice.current.message === message &&
          now - lastNotice.current.shownAt < DUPLICATE_WINDOW_MS
        ) {
          return;
        }
        lastNotice.current = { message, shownAt: now };

        if (/account is disabled/i.test(message)) {
          signOut();
          Alert.alert(
            "Account disabled",
            "Your account was disabled. Contact your account owner to restore access.",
          );
          return;
        }

        Alert.alert("Access denied", message);
      }),
    [signOut],
  );

  return null;
}
