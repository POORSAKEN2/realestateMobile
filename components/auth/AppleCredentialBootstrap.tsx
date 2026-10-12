import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { apiClient } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { getSessionAccess } from "../../services/access/sessionAccess";
import { nativeApple } from "../../services/apple/nativeApple";

export function AppleCredentialBootstrap() {
  const { session, signOut } = useAuth();
  useEffect(() => {
    if (
      Platform.OS !== "ios" ||
      session?.authMethod !== "apple" ||
      !session.appleUserId
    )
      return;
    let disposed = false;
    const revoke = () => {
      if (disposed || getSessionAccess().token !== session.accessToken) return;
      void apiClient.post("/logout").catch(() => {});
      signOut();
    };
    const check = () => {
      void nativeApple
        .isAuthorized(session.appleUserId!)
        .then((authorized) => {
          if (!authorized) revoke();
        })
        .catch(() => {});
    };
    check();
    const removeRevoke = nativeApple.onRevoke(revoke);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => {
      disposed = true;
      removeRevoke();
      subscription.remove();
    };
  }, [
    session?.accessToken,
    session?.authMethod,
    session?.appleUserId,
    signOut,
  ]);
  return null;
}
