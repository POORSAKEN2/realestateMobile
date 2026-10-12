import { normalizeUser } from "../../api/user";
import type { AuthResponse, AuthSession } from "../../types";

export function sessionFromAuthResponse(response: AuthResponse): AuthSession {
  const data = response.data;
  if (!data?.access_token || !data.user || typeof data.user !== "object") {
    throw new Error(
      "Sign-in completed without a valid session. Please try again.",
    );
  }
  return {
    accessToken: data.access_token,
    authMethod: data.auth_method ?? "password",
    appleUserId: data.apple_user_id ?? undefined,
    user: normalizeUser({
      ...data.user,
      ...Object.fromEntries(
        Object.entries(data).filter(([key]) =>
          [
            "permissions",
            "assigned_property_ids",
            "property_permissions",
          ].includes(key),
        ),
      ),
    }),
    onboarding: data.onboarding,
    deletionRecovery: data.deletion_recovery,
  };
}
