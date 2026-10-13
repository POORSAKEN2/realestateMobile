import {
  ApiError,
  isTechnicalMessage,
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
} from "../../api/errors";

export type AuthErrorFeedback = {
  title: string;
  message: string;
  retryable: boolean;
  requestId?: string;
  retryAfterSeconds?: number;
};

export function authErrorFeedback(
  error: unknown,
  action: "signin" | "register" | "verification" = "signin",
): AuthErrorFeedback {
  const title =
    action === "signin"
      ? "Unable to sign in"
      : action === "register"
        ? "Unable to create account"
        : "Unable to send verification code";
  if (error instanceof ApiError) {
    if (error.code === "apple_identity_unverified") {
      return {
        title,
        message: "Apple sign-in couldn’t be verified. Please try again.",
        retryable: true,
        requestId: error.requestId,
      };
    }
    const network = error.status === 0;
    const server = error.status >= 500 || error.code === "invalid_response";
    const credential =
      action === "signin" &&
      /credentials do not match|email or password is incorrect/i.test(
        error.message,
      );
    return {
      title: network
        ? "Connection problem"
        : error.status === 429
          ? "Please wait"
          : title,
      message: network
        ? NETWORK_ERROR_MESSAGE
        : server
          ? SERVER_ERROR_MESSAGE
          : credential
            ? "Email or password is incorrect."
            : error.message,
      retryable: error.retryable,
      requestId: error.requestId,
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("ERR_")
  ) {
    return {
      title,
      message: "Apple sign-in could not complete. Please try again.",
      retryable: true,
    };
  }
  const message = error instanceof Error ? error.message : "";
  return {
    title,
    message:
      message && !isTechnicalMessage(message) ? message : SERVER_ERROR_MESSAGE,
    retryable: !message || isTechnicalMessage(message),
  };
}
