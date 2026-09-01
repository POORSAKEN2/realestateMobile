import { apiClient } from "./client";
import type { ForgotPasswordPayload, ResetPasswordPayload } from "../types";

export type ForgotPasswordResponse = {
  message?: string;
  expires_in_seconds?: number;
  cooldown_seconds?: number;
};

export type ResetPasswordResponse = {
  message?: string;
};

export async function requestForgotPasswordOtp(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  return apiClient.post<ForgotPasswordResponse>("/forgot-password", payload);
}

export async function submitResetPassword(
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> {
  return apiClient.post<ResetPasswordResponse>("/reset-password", payload);
}
