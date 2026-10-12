import type { ApiEnvelope, AuthResponse, AuthSession } from "../../types";
import type { nativeApple, AppleChallenge } from "./nativeApple";

export type ApplePendingAccount = {
  pending_token: string;
  email?: string;
  can_register: boolean;
  name?: string;
  reason?: "existing_account" | "email_required" | "setup_required";
  expires_in_seconds?: number;
};
export type AppleLoginResult =
  | { status: "authenticated"; session: AuthSession }
  | { status: "account_required"; account: ApplePendingAccount };
export type AppleAccountInput =
  | { email: string; password: string }
  | { name: string; company: string; confirmation: boolean };
export type AppleLinkCodeResult = {
  message: string;
  expires_in_seconds: number;
  cooldown_seconds: number;
};
type AppleSignupIntent = { autoRegister: boolean; confirmation: boolean };
type Verification = NonNullable<AuthResponse["data"]> &
  ApplePendingAccount & {
    status: "authenticated" | "account_required" | "reauthenticated";
    reauth_token?: string;
  };
type Dependencies = {
  enabled: () => boolean;
  native: typeof nativeApple;
  post: <T>(
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ) => Promise<ApiEnvelope<T>>;
  toSession: (response: AuthResponse) => AuthSession;
};

export function isAppleCancellation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  return (
    ("code" in error &&
      ["ERR_REQUEST_CANCELED", "ERR_CANCELED"].includes(String(error.code))) ||
    ("name" in error && error.name === "AbortError")
  );
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted)
    throw Object.assign(new Error("Apple sign-in cancelled."), {
      code: "ERR_REQUEST_CANCELED",
    });
}

export function createAppleAuthentication({
  enabled,
  native,
  post,
  toSession,
}: Dependencies) {
  const isAvailable = async () => enabled() && (await native.isAvailable());
  const verify = async (
    signal?: AbortSignal,
    operation?: "deletion_request" | "deletion_response",
    requestId?: string,
    intent?: AppleSignupIntent,
  ) => {
    assertNotAborted(signal);
    if (!(await isAvailable()))
      throw new Error("Apple sign-in is not available on this device.");
    const prefix = operation ? "/auth/apple/reauth" : "/auth/apple";
    const { data: challenge } = await post<AppleChallenge>(
      `${prefix}/challenge`,
      operation ? { operation, request_id: requestId } : undefined,
      signal,
    );
    if (!challenge?.challenge_id || !challenge.nonce || !challenge.state)
      throw new Error("Apple sign-in could not start. Please try again.");
    assertNotAborted(signal);
    const credential = await native.signIn(challenge);
    assertNotAborted(signal);
    if (
      credential.state !== challenge.state ||
      !credential.identityToken ||
      !credential.authorizationCode
    )
      throw new Error(
        "Apple did not return valid credentials. Please try again.",
      );
    const { data } = await post<Verification>(
      `${prefix}/verify`,
      {
        challenge_id: challenge.challenge_id,
        state: credential.state,
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
        ...(!operation && intent?.autoRegister
          ? {
              auto_register: true,
              confirmation: intent.confirmation,
              display_name: credential.name,
            }
          : {}),
      },
      signal,
    );
    if (!data)
      throw new Error("Apple sign-in returned no result. Please try again.");
    return { data, name: credential.name };
  };
  return {
    isAvailable,
    async login(
      signal?: AbortSignal,
      intent?: AppleSignupIntent,
    ): Promise<AppleLoginResult> {
      if (intent?.autoRegister && !intent.confirmation)
        throw new Error(
          "Legal documents are unavailable in this build. Please try again once they are available.",
        );
      const { data, name } = await verify(signal, undefined, undefined, intent);
      if (data.status === "authenticated")
        return { status: "authenticated", session: toSession({ data }) };
      if (data.status !== "account_required" || !data.pending_token)
        throw new Error("Apple sign-in returned an invalid result.");
      return {
        status: "account_required",
        account: {
          pending_token: data.pending_token,
          email: data.email,
          can_register: data.can_register,
          name,
          ...(data.reason ? { reason: data.reason } : {}),
          ...(data.expires_in_seconds
            ? { expires_in_seconds: data.expires_in_seconds }
            : {}),
        },
      };
    },
    async requestLinkCode(
      account: ApplePendingAccount,
      email: string,
      signal?: AbortSignal,
    ): Promise<AppleLinkCodeResult> {
      assertNotAborted(signal);
      const { data } = await post<AppleLinkCodeResult>(
        "/auth/apple/link/request-code",
        {
          pending_token: account.pending_token,
          email: email.trim(),
        },
        signal,
      );
      if (
        !data ||
        typeof data.cooldown_seconds !== "number" ||
        typeof data.expires_in_seconds !== "number"
      )
        throw new Error(
          "The verification code could not be requested. Please try again.",
        );
      return data;
    },
    async verifyLinkCode(
      account: ApplePendingAccount,
      email: string,
      code: string,
      signal?: AbortSignal,
    ): Promise<AuthSession> {
      assertNotAborted(signal);
      return toSession(
        await post<NonNullable<AuthResponse["data"]>>(
          "/auth/apple/link/verify-code",
          {
            pending_token: account.pending_token,
            email: email.trim(),
            otp_code: code.trim(),
          },
          signal,
        ),
      );
    },
    async complete(
      account: ApplePendingAccount,
      input: AppleAccountInput,
      signal?: AbortSignal,
    ): Promise<AuthSession> {
      assertNotAborted(signal);
      return toSession(
        await post<NonNullable<AuthResponse["data"]>>(
          `/auth/apple/${"password" in input ? "link" : "register"}`,
          { ...input, pending_token: account.pending_token },
          signal,
        ),
      );
    },
    async reauthenticate(
      operation: "deletion_request" | "deletion_response",
      requestId?: string,
    ): Promise<string> {
      const { data } = await verify(undefined, operation, requestId);
      if (data.status !== "reauthenticated" || !data.reauth_token)
        throw new Error("Apple verification failed. Please try again.");
      return data.reauth_token;
    },
  };
}
