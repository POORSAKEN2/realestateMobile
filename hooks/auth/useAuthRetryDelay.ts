import { useEffect, useMemo, useState } from "react";
import type { AuthErrorFeedback } from "../../utils/auth/authErrorFeedback";

export function useAuthRetryDelay(feedback: AuthErrorFeedback | null) {
  const deadline = useMemo(
    () => Date.now() + (feedback?.retryAfterSeconds ?? 0) * 1000,
    [feedback],
  );
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (deadline <= Date.now()) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= deadline) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return feedback?.retryAfterSeconds
    ? Math.max(0, Math.ceil((deadline - now) / 1000))
    : 0;
}
