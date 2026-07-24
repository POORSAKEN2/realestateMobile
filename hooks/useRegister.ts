import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler } from "react-native";

import {
  apiRegistrationService,
  type RegistrationService,
} from "../services/registration";
import type { RegistrationDraft } from "../types";
import {
  buildRegisterPayload,
  getPasswordValidationMessage,
  isVerificationRegistrationError,
  validateCompanyName,
  validateRegistrationCredentials,
  validateRegistrationName,
  validateVerificationCode,
} from "../utils/auth/registration";
import { useAuth } from "./useAuth";

export const VERIFICATION_CODE_LENGTH = 6;

export type RegistrationStep =
  | "credentials"
  | "verification"
  | "name"
  | "company";

type RegistrationFeedback = {
  message: string;
  tone: "error" | "info";
};

const STEPS: readonly RegistrationStep[] = [
  "credentials",
  "verification",
  "name",
  "company",
];

const initialDraft: RegistrationDraft = {
  email: "",
  password: "",
  verificationCode: "",
  firstName: "",
  lastName: "",
  company: "",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Registration failed. Please try again.";
}

export function useRegister(
  registrationService: RegistrationService = apiRegistrationService,
) {
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState<RegistrationStep>("credentials");
  const [feedback, setFeedback] = useState<RegistrationFeedback | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const requestedCredentialsRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const { signIn } = useAuth();

  const stepIndex = STEPS.indexOf(step);
  const passwordWarning = useMemo(
    () => (draft.password ? getPasswordValidationMessage(draft.password) : ""),
    [draft.password],
  );
  const codeDigits = useMemo(
    () =>
      Array.from(
        { length: VERIFICATION_CODE_LENGTH },
        (_, index) => draft.verificationCode[index] ?? "",
      ),
    [draft.verificationCode],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setTimeout(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  const updateField = useCallback(
    <Field extends keyof RegistrationDraft>(
      field: Field,
      value: RegistrationDraft[Field],
    ) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setFeedback(null);
    },
    [],
  );

  const requestVerificationCode = useCallback(
    async (force = false) => {
      if (isRequestingCode || (!force && secondsRemaining > 0)) {
        return false;
      }

      setIsRequestingCode(true);
      setFeedback(null);

      try {
        const receipt = await registrationService.requestVerificationCode({
          email: draft.email,
          password: draft.password,
        });

        if (!isMountedRef.current) return false;

        setDraft((current) => ({ ...current, verificationCode: "" }));
        setSecondsRemaining(receipt.cooldownSeconds);
        setFeedback({ message: receipt.message, tone: "info" });
        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;

        setSecondsRemaining(0);
        setFeedback({ message: getErrorMessage(error), tone: "error" });
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsRequestingCode(false);
        }
      }
    },
    [
      draft.email,
      draft.password,
      isRequestingCode,
      registrationService,
      secondsRemaining,
    ],
  );

  useEffect(() => {
    if (step !== "verification") return;

    const credentialKey = draft.email.trim().toLowerCase();
    if (requestedCredentialsRef.current === credentialKey) return;

    requestedCredentialsRef.current = credentialKey;
    void requestVerificationCode(true);
  }, [draft.email, draft.password, requestVerificationCode, step]);

  const continueFromCredentials = useCallback(() => {
    const message = validateRegistrationCredentials(
      draft.email,
      draft.password,
    );

    if (message) {
      setFeedback({ message, tone: "error" });
      return;
    }

    setFeedback(null);
    setStep("verification");
  }, [draft.email, draft.password]);

  const continueFromVerification = useCallback(() => {
    const message = validateVerificationCode(draft.verificationCode);

    if (message) {
      setFeedback({ message, tone: "error" });
      return;
    }

    setFeedback(null);
    setStep("name");
  }, [draft.verificationCode]);

  const continueFromName = useCallback(() => {
    const message = validateRegistrationName(draft.firstName, draft.lastName);

    if (message) {
      setFeedback({ message, tone: "error" });
      return;
    }

    setFeedback(null);
    setStep("company");
  }, [draft.firstName, draft.lastName]);

  const register = useCallback(async () => {
    const companyMessage = validateCompanyName(draft.company);

    if (companyMessage) {
      setFeedback({ message: companyMessage, tone: "error" });
      return;
    }

    setIsRegistering(true);
    setFeedback(null);

    try {
      const session = await registrationService.register(
        buildRegisterPayload(draft),
      );

      if (!isMountedRef.current) return;

      signIn(session);
      Alert.alert("Welcome to R.E.M.", "Your account is ready.");
      router.replace("/");
    } catch (error) {
      if (!isMountedRef.current) return;

      const message = getErrorMessage(error);
      setFeedback({ message, tone: "error" });

      if (isVerificationRegistrationError(message)) {
        setStep("verification");
      }
    } finally {
      if (isMountedRef.current) {
        setIsRegistering(false);
      }
    }
  }, [draft, registrationService, signIn]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) {
      router.back();
      return;
    }

    setFeedback(null);
    setStep(STEPS[stepIndex - 1]);
  }, [stepIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goBack();
        return true;
      },
    );

    return () => subscription.remove();
  }, [goBack]);

  return {
    codeDigits,
    continueFromCredentials,
    continueFromName,
    continueFromVerification,
    draft,
    feedback,
    goBack,
    isRegistering,
    isRequestingCode,
    passwordWarning,
    register,
    requestVerificationCode,
    secondsRemaining,
    step,
    stepIndex,
    updateCodeDigits: (digits: string[]) =>
      updateField("verificationCode", digits.join("")),
    updateField,
  };
}
