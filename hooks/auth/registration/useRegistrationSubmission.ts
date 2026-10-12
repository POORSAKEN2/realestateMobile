import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { authErrorFeedback } from "../../../utils/auth/authErrorFeedback";

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
  const locked = useRef(false);
  const isMountedRef = useMountedRef();
  const { signIn } = useAuth();

  const submitRegistration = useCallback(async () => {
    if (locked.current) return;
    locked.current = true;
    setIsRegistering(true);
    onFeedback(null);

    try {
      const session = await service.register(buildRegisterPayload(draft));

      if (!isMountedRef.current) return;

      signIn(session);
      router.replace("/");
    } catch (error) {
      if (!isMountedRef.current) return;

      const message = getRegistrationErrorMessage(error);
      onFeedback({
        message,
        tone: "error",
        error: authErrorFeedback(error, "register"),
      });

      if (isVerificationRegistrationError(message)) {
        onVerificationFailure();
      }
    } finally {
      locked.current = false;
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
