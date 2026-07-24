import { useCallback, useEffect, useRef, useState } from "react";

import type { RegistrationFeedback } from "../../../constants/registration";
import type { RegistrationService } from "../../../services/registration";
import { getRegistrationErrorMessage } from "../../../utils/auth/registration";
import { useMountedRef } from "../../useMountedRef";

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
      if (isRequestingCode || (!force && secondsRemaining > 0)) {
        return false;
      }

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

        setSecondsRemaining(0);
        onFeedback({
          message: getRegistrationErrorMessage(
            error,
            "Unable to send the verification code. Please try again.",
          ),
          tone: "error",
        });
        return false;
      } finally {
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
