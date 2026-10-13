import { apiClient } from "./client";
import { normalizeUser } from "./user";
import type { ApiEnvelope, AuthUser } from "../types";

export async function setFirstPassword(
  password: string,
  confirmation: string,
  receipt: string,
  signal: AbortSignal,
): Promise<AuthUser> {
  const response = await apiClient.post<ApiEnvelope<AuthUser>>(
    "/user/set-password",
    {
      password,
      password_confirmation: confirmation,
      apple_reauth_token: receipt,
    },
    { signal },
  );
  if (!response.data || response.data.has_password !== true)
    throw new Error(
      "Password setup returned an invalid result. Please try again.",
    );
  return normalizeUser(response.data);
}
