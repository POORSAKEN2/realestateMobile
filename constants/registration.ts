import type { RegistrationDraft } from "../types";

export const VERIFICATION_CODE_LENGTH = 6;

export const REGISTRATION_STEPS = [
  "credentials",
  "verification",
  "name",
  "company",
] as const;

export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];

export type RegistrationFeedback = {
  message: string;
  tone: "error" | "info";
};

export const INITIAL_REGISTRATION_DRAFT: RegistrationDraft = {
  email: "",
  password: "",
  verificationCode: "",
  firstName: "",
  lastName: "",
  company: "",
};

export const REGISTRATION_STEP_CONTENT: Record<
  RegistrationStep,
  {
    buttonLabel: string;
    subtitle: string;
    title: string;
  }
> = {
  credentials: {
    buttonLabel: "Continue",
    subtitle:
      "Use the email address you want connected to your R.E.M. workspace.",
    title: "Create your account",
  },
  verification: {
    buttonLabel: "Verify & continue",
    subtitle:
      "Enter the six-digit verification code we sent when this step opened.",
    title: "Check your email",
  },
  name: {
    buttonLabel: "Continue",
    subtitle:
      "Add your legal first and last name. We’ll combine them for your account profile.",
    title: "What’s your name?",
  },
  company: {
    buttonLabel: "Create account",
    subtitle:
      "Tell us the company or real estate business this workspace belongs to.",
    title: "Name your company",
  },
};
