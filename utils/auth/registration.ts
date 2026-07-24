import type { RegisterFormData, RegistrationDraft } from "../../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

export function getRegistrationErrorMessage(
  error: unknown,
  fallback = "Registration failed. Please try again.",
) {
  return error instanceof Error ? error.message : fallback;
}

export function validateRegistrationCredentials(
  email: string,
  password: string,
) {
  if (!EMAIL_PATTERN.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  return getPasswordValidationMessage(password);
}

export function getPasswordValidationMessage(password: string) {
  if (password.length < 8) {
    return "Use at least 8 characters for your password.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use both letters and numbers in your password.";
  }

  return "";
}

export function validateVerificationCode(code: string) {
  return VERIFICATION_CODE_PATTERN.test(code)
    ? ""
    : "Enter the complete 6-digit verification code.";
}

export function validateRegistrationName(firstName: string, lastName: string) {
  if (!firstName.trim()) {
    return "First name is required.";
  }

  if (!lastName.trim()) {
    return "Last name is required.";
  }

  if (buildFullName(firstName, lastName).length > 255) {
    return "Your full name must be 255 characters or fewer.";
  }

  return "";
}

export function validateCompanyName(company: string) {
  if (!company.trim()) {
    return "Company name is required.";
  }

  if (company.trim().length > 255) {
    return "Company name must be 255 characters or fewer.";
  }

  return "";
}

export function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function buildRegisterPayload(
  draft: RegistrationDraft,
): RegisterFormData {
  return {
    name: buildFullName(draft.firstName, draft.lastName),
    email: draft.email.trim().toLowerCase(),
    password: draft.password,
    password_confirmation: draft.password,
    company: draft.company.trim(),
    otp_code: draft.verificationCode,
  };
}

export function isVerificationRegistrationError(message: string) {
  return /otp|verification|code|expired|attempt|lockout/i.test(message);
}
