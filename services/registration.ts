import { apiClient, unwrapData } from "../api/client";
import { normalizeUser } from "../api/user";
import type {
  ApiEnvelope,
  AuthResponse,
  AuthSession,
  RegisterFormData,
} from "../types";

export type RegistrationCredentials = {
  email: string;
  password: string;
};

export type RegistrationCodeReceipt = {
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

export type RegistrationService = {
  register: (payload: RegisterFormData) => Promise<AuthSession>;
  requestVerificationCode: (
    credentials: RegistrationCredentials,
  ) => Promise<RegistrationCodeReceipt>;
};

type RegistrationCodeResponse = {
  message?: string;
  cooldown_seconds?: number;
  expires_in_seconds?: number;
};

const DEFAULT_COOLDOWN_SECONDS = 30;
const DEFAULT_EXPIRY_SECONDS = 600;

function buildOtpRequestPayload({ email, password }: RegistrationCredentials) {
  /*
   * The current API validates name and company when an OTP is requested,
   * although neither value is persisted at that stage. Keep that compatibility
   * detail inside this adapter so the onboarding flow only depends on the
   * credentials it actually has on step one.
   */
  return {
    name: "Account owner",
    company: "Registration in progress",
    email: email.trim().toLowerCase(),
    password,
    password_confirmation: password,
  };
}

export const apiRegistrationService: RegistrationService = {
  async requestVerificationCode(credentials) {
    const response = await apiClient.post<
      ApiEnvelope<RegistrationCodeResponse> | RegistrationCodeResponse
    >("/register/request-otp", buildOtpRequestPayload(credentials));
    const data = unwrapData<RegistrationCodeResponse>(response);

    return {
      message:
        data.message ??
        `A verification code was sent to ${credentials.email.trim()}.`,
      cooldownSeconds: data.cooldown_seconds ?? DEFAULT_COOLDOWN_SECONDS,
      expiresInSeconds: data.expires_in_seconds ?? DEFAULT_EXPIRY_SECONDS,
    };
  },

  async register(payload) {
    const response = await apiClient.post<AuthResponse>("/register", payload);
    const { access_token, user, onboarding } = response.data ?? {};

    if (!access_token) {
      throw new Error(
        response.message ?? "Registration completed without an access token.",
      );
    }

    return {
      accessToken: access_token,
      user: user && typeof user === "object" ? normalizeUser(user) : user,
      onboarding,
    };
  },
};
