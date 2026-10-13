import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { apiClient, authHeaders } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { getSessionAccess } from "../../services/access/sessionAccess";
import { nativeApple } from "../../services/apple/nativeApple";
import { createAppleCredentialMonitor } from "../../services/apple/appleCredentialState";

export function AppleCredentialBootstrap() {
  const { session, signOut } = useAuth();
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      session?.authMethod !== "apple" ||
      !session.accessToken ||
      !session.appleUserId
    )
      return;
    const token = session.accessToken;
    const monitor = createAppleCredentialMonitor({
      token,
      currentToken: () => getSessionAccess().token,
      read: () => nativeApple.getCredentialState(session.appleUserId!),
      onInvalidate: (reason) => {
        console.info("[auth] Session invalidated", { reason });
        void apiClient
          .post("/logout", undefined, { headers: authHeaders(token) })
          .catch(() => {});
        signOutRef.current();
      },
    });
    void monitor.check();
    const removeRevoke = nativeApple.onRevoke(monitor.revoke);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void monitor.check();
    });
    return () => {
      monitor.dispose();
      removeRevoke();
      subscription.remove();
    };
  }, [session?.accessToken, session?.authMethod, session?.appleUserId]);
  return null;
}
