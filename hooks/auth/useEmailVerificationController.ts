import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { EmailVerificationService } from "../../services/emailVerification";

export type EmailVerificationFeedback = {
  message: string;
  tone: "error" | "info";
};

type UseEmailVerificationControllerOptions = {
  codeLength: number;
  resendDelaySeconds: number;
  service: EmailVerificationService;
};

export function useEmailVerificationController({
  codeLength,
  resendDelaySeconds,
  service,
}: UseEmailVerificationControllerOptions) {
  const [digits, setDigits] = useState(() =>
    Array.from({ length: codeLength }, () => ""),
  );
  const [secondsRemaining, setSecondsRemaining] = useState(resendDelaySeconds);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [feedback, setFeedback] = useState<EmailVerificationFeedback | null>(
    null,
  );
  const isMountedRef = useRef(true);

  const code = useMemo(() => digits.join(""), [digits]);
  const isComplete = code.length === codeLength;

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

  const updateDigits = useCallback((values: string[]) => {
    setDigits(values);
    setFeedback(null);
  }, []);

  const verifyCode = useCallback(async () => {
    if (!isComplete || isVerifying) return;

    setIsVerifying(true);
    setFeedback(null);

    try {
      const message = await service.verify(code);
      if (isMountedRef.current) {
        setFeedback({ message, tone: "info" });
      }
    } catch {
      if (isMountedRef.current) {
        setFeedback({
          message: "Unable to verify the code. Please try again.",
          tone: "error",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsVerifying(false);
      }
    }
  }, [code, isComplete, isVerifying, service]);

  const requestNewCode = useCallback(async () => {
    if (secondsRemaining > 0 || isRequestingCode) return false;

    setIsRequestingCode(true);
    setFeedback(null);

    try {
      const message = await service.requestNewCode();
      if (!isMountedRef.current) return false;

      setDigits(Array.from({ length: codeLength }, () => ""));
      setFeedback({ message, tone: "info" });
      setSecondsRemaining(resendDelaySeconds);
      return true;
    } catch {
      if (isMountedRef.current) {
        setFeedback({
          message: "Unable to send a new verification email. Please try again.",
          tone: "error",
        });
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsRequestingCode(false);
      }
    }
  }, [
    codeLength,
    isRequestingCode,
    resendDelaySeconds,
    secondsRemaining,
    service,
  ]);

  return {
    digits,
    feedback,
    isComplete,
    isRequestingCode,
    isVerifying,
    requestNewCode,
    secondsRemaining,
    updateDigits,
    verifyCode,
  };
}
