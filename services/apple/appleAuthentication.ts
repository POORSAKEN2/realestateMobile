import { apiClient } from "../../api/client";
import { sessionFromAuthResponse } from "../../utils/auth/authSession";
import { createAppleAuthentication } from "./appleAuthenticationCore";
import { nativeApple } from "./nativeApple";

export { isAppleCancellation } from "./appleAuthenticationCore";
export type {
  ApplePendingAccount,
  AppleLoginResult,
} from "./appleAuthenticationCore";

const apple = createAppleAuthentication({
  enabled: () => process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === "true",
  native: nativeApple,
  post: (path, body, signal) => apiClient.post(path, body, { signal }),
  toSession: sessionFromAuthResponse,
});

export const isAppleLoginAvailable = apple.isAvailable;
export const loginWithApple = apple.login;
export const completeAppleAccount = apple.complete;
export const reauthenticateApple = apple.reauthenticate;
