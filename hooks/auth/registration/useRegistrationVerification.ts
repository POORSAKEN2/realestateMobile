import { useCallback, useEffect, useRef, useState } from "react";

import type { RegistrationFeedback } from "../../../constants/registration";
import type { RegistrationService } from "../../../services/registration";
import { getRegistrationErrorMessage } from "../../../utils/auth/registration";
import { useMountedRef } from "../../useMountedRef";
import { authErrorFeedback } from "../../../utils/auth/authErrorFeedback";

type UseRegistrationVerificationOptions = {
  email: string;
  isActive: boolean;
  onCodeRequested: () => void;
  onFeedback: (feedback: RegistrationFeedback | null) => void;
  password: string;
  service: RegistrationService;
};

export function useRegistrationVerification({
  email,
  isActive,
  onCodeRequested,
  onFeedback,
  password,
  service,
}: UseRegistrationVerificationOptions) {
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const requestedEmailRef = useRef<string | null>(null);
  const requesting = useRef(false);
  const isMountedRef = useMountedRef();

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = setTimeout(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining]);

  const requestVerificationCode = useCallback(
    async (force = false) => {
      if (requesting.current || isRequestingCode || secondsRemaining > 0) {
        return false;
      }

      requesting.current = true;
      setIsRequestingCode(true);
      onFeedback(null);

      try {
        const receipt = await service.requestVerificationCode({
          email,
          password,
        });

        if (!isMountedRef.current) return false;

        onCodeRequested();
        setSecondsRemaining(receipt.cooldownSeconds);
        onFeedback({ message: receipt.message, tone: "info" });
        return true;
      } catch (error) {
        if (!isMountedRef.current) return false;

        const failure = authErrorFeedback(error, "verification");
        setSecondsRemaining(failure.retryAfterSeconds ?? 0);
        onFeedback({
          message: getRegistrationErrorMessage(
            error,
            "Unable to send the verification code. Please try again.",
          ),
          tone: "error",
          error: failure,
        });
        return false;
      } finally {
        requesting.current = false;
        if (isMountedRef.current) {
          setIsRequestingCode(false);
        }
      }
    },
    [
      email,
      isRequestingCode,
      onCodeRequested,
      onFeedback,
      password,
      secondsRemaining,
      service,
    ],
  );

  useEffect(() => {
    if (!isActive) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (requestedEmailRef.current === normalizedEmail) return;

    requestedEmailRef.current = normalizedEmail;
    void requestVerificationCode(true);
  }, [email, isActive, requestVerificationCode]);

  return {
    isRequestingCode,
    requestVerificationCode,
    secondsRemaining,
  };
}
