import { router } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { BackHandler } from "react-native";

import {
  REGISTRATION_STEPS,
  VERIFICATION_CODE_LENGTH,
} from "../../../constants/registration";
import {
  apiRegistrationService,
  type RegistrationService,
} from "../../../services/registration";
import {
  getPasswordValidationMessage,
  validateCompanyName,
  validateRegistrationCredentials,
  validateRegistrationName,
  validateVerificationCode,
} from "../../../utils/auth/registration";
import { useRegistrationState } from "./useRegistrationState";
import { useRegistrationSubmission } from "./useRegistrationSubmission";
import { useRegistrationVerification } from "./useRegistrationVerification";

export function useRegistrationFlow(
  service: RegistrationService = apiRegistrationService,
) {
  const {
    draft,
    feedback,
    setFeedback,
    setStep,
    showError,
    step,
    updateField,
  } = useRegistrationState();
  const stepIndex = REGISTRATION_STEPS.indexOf(step);

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

  const clearVerificationCode = useCallback(
    () => updateField("verificationCode", ""),
    [updateField],
  );
  const returnToVerification = useCallback(
    () => setStep("verification"),
    [setStep],
  );

  const { isRequestingCode, requestVerificationCode, secondsRemaining } =
    useRegistrationVerification({
      email: draft.email,
      isActive: step === "verification",
      onCodeRequested: clearVerificationCode,
      onFeedback: setFeedback,
      password: draft.password,
      service,
    });
  const { isRegistering, submitRegistration } = useRegistrationSubmission({
    draft,
    onFeedback: setFeedback,
    onVerificationFailure: returnToVerification,
    service,
  });

  const continueFromCredentials = useCallback(() => {
    const message = validateRegistrationCredentials(
      draft.email,
      draft.password,
    );

    if (message) {
      showError(message);
      return;
    }

    setFeedback(null);
    setStep("verification");
  }, [draft.email, draft.password, setFeedback, setStep, showError]);

  const continueFromVerification = useCallback(() => {
    const message = validateVerificationCode(draft.verificationCode);

    if (message) {
      showError(message);
      return;
    }

    setFeedback(null);
    setStep("name");
  }, [draft.verificationCode, setFeedback, setStep, showError]);

  const continueFromName = useCallback(() => {
    const message = validateRegistrationName(draft.firstName, draft.lastName);

    if (message) {
      showError(message);
      return;
    }

    setFeedback(null);
    setStep("company");
  }, [draft.firstName, draft.lastName, setFeedback, setStep, showError]);

  const register = useCallback(() => {
    const message = validateCompanyName(draft.company);

    if (message) {
      showError(message);
      return;
    }

    void submitRegistration();
  }, [draft.company, showError, submitRegistration]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) {
      router.back();
      return;
    }

    setFeedback(null);
    setStep(REGISTRATION_STEPS[stepIndex - 1]);
  }, [setFeedback, setStep, stepIndex]);

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

  const continueRegistration = {
    credentials: continueFromCredentials,
    verification: continueFromVerification,
    name: continueFromName,
    company: register,
  }[step];
  const isContinueDisabled =
    step === "verification" &&
    (isRequestingCode ||
      draft.verificationCode.length !== VERIFICATION_CODE_LENGTH);

  return {
    codeDigits,
    continueRegistration,
    draft,
    feedback,
    goBack,
    isContinueDisabled,
    isRegistering,
    isRequestingCode,
    passwordWarning,
    requestVerificationCode,
    secondsRemaining,
    step,
    stepIndex,
    updateCodeDigits: (digits: string[]) =>
      updateField("verificationCode", digits.join("")),
    updateField,
  };
}
