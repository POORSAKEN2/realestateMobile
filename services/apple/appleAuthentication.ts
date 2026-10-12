import { apiClient } from "../../api/client";
import { sessionFromAuthResponse } from "../../utils/auth/authSession";
import { createAppleAuthentication } from "./appleAuthenticationCore";
import { nativeApple } from "./nativeApple";
import { LEGAL_DOCUMENT_URLS } from "../../constants/legal";

export { isAppleCancellation } from "./appleAuthenticationCore";
export type {
  ApplePendingAccount,
  AppleLoginResult,
  AppleLinkCodeResult,
} from "./appleAuthenticationCore";

const apple = createAppleAuthentication({
  enabled: () => process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === "true",
  native: nativeApple,
  post: (path, body, signal) => apiClient.post(path, body, { signal }),
  toSession: sessionFromAuthResponse,
});

export const isAppleLoginAvailable = apple.isAvailable;
export const loginWithApple = async (signal?: AbortSignal) => {
  const legalReady = Boolean(
    LEGAL_DOCUMENT_URLS.terms && LEGAL_DOCUMENT_URLS.privacy,
  );
  const result = await apple.login(signal, {
    autoRegister: legalReady,
    confirmation: legalReady,
  });
  if (
    !legalReady &&
    result.status === "account_required" &&
    (result.account.reason === "setup_required" ||
      (!result.account.reason && result.account.can_register))
  ) {
    throw new Error(
      "Legal documents are unavailable in this build. Account creation is disabled.",
    );
  }
  return result;
};
export const completeAppleAccount = apple.complete;
export const requestAppleLinkCode = apple.requestLinkCode;
export const verifyAppleLinkCode = apple.verifyLinkCode;
export const reauthenticateApple = apple.reauthenticate;
