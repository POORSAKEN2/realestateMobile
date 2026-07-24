import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import type { RegistrationFeedback } from "../../../constants/registration";
import type { RegistrationService } from "../../../services/registration";
import type { RegistrationDraft } from "../../../types";
import {
  buildRegisterPayload,
  getRegistrationErrorMessage,
  isVerificationRegistrationError,
} from "../../../utils/auth/registration";
import { useAuth } from "../../useAuth";
import { useMountedRef } from "../../useMountedRef";

type UseRegistrationSubmissionOptions = {
  draft: RegistrationDraft;
  onFeedback: (feedback: RegistrationFeedback | null) => void;
  onVerificationFailure: () => void;
  service: RegistrationService;
};

export function useRegistrationSubmission({
  draft,
  onFeedback,
  onVerificationFailure,
  service,
}: UseRegistrationSubmissionOptions) {
  const [isRegistering, setIsRegistering] = useState(false);
  const isMountedRef = useMountedRef();
  const { signIn } = useAuth();

  const submitRegistration = useCallback(async () => {
    setIsRegistering(true);
    onFeedback(null);

    try {
      const session = await service.register(buildRegisterPayload(draft));

      if (!isMountedRef.current) return;

      signIn(session);
      Alert.alert("Welcome to R.E.M.", "Your account is ready.");
      router.replace("/");
    } catch (error) {
      if (!isMountedRef.current) return;

      const message = getRegistrationErrorMessage(error);
      onFeedback({ message, tone: "error" });

      if (isVerificationRegistrationError(message)) {
        onVerificationFailure();
      }
    } finally {
      if (isMountedRef.current) {
        setIsRegistering(false);
      }
    }
  }, [draft, onFeedback, onVerificationFailure, service, signIn]);

  return {
    isRegistering,
    submitRegistration,
  };
}
