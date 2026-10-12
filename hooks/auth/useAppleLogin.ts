import { useEffect, useRef, useState } from "react";
import type { AuthSession } from "../../types";
import {
  completeAppleAccount,
  isAppleCancellation,
  isAppleLoginAvailable,
  loginWithApple,
  type ApplePendingAccount,
} from "../../services/apple/appleAuthentication";
import { useMountedRef } from "../useMountedRef";

export function useAppleLogin(onAuthenticated: (session: AuthSession) => void) {
  const mounted = useMountedRef();
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<ApplePendingAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void isAppleLoginAvailable()
      .then((value) => {
        if (mounted.current) setAvailable(value);
      })
      .catch(() => {});
  }, [mounted]);
  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    if (!account) return;
    const timer = setTimeout(
      () => {
        setAccount(null);
        setError("Apple verification expired. Start again.");
      },
      10 * 60 * 1000,
    );
    return () => clearTimeout(timer);
  }, [account]);

  const perform = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    controller.current = new AbortController();
    setBusy(true);
    setError(null);
    try {
      await action(controller.current.signal);
    } catch (failure) {
      if (mounted.current && !isAppleCancellation(failure))
        setError(
          failure instanceof Error
            ? failure.message
            : "Apple sign-in failed. Please try again.",
        );
    } finally {
      locked.current = false;
      controller.current = null;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    available,
    busy,
    account,
    error,
    start: () =>
      perform(async (signal) => {
        const result = await loginWithApple(signal);
        if (!mounted.current) return;
        if (result.status === "authenticated") onAuthenticated(result.session);
        else setAccount(result.account);
      }),
    complete: (
      input:
        | { email: string; password: string }
        | { name: string; company: string; confirmation: boolean },
    ) =>
      perform(async (signal) => {
        if (!account) return;
        const session = await completeAppleAccount(account, input, signal);
        if (!mounted.current) return;
        setAccount(null);
        onAuthenticated(session);
      }),
    cancel: () => {
      if (!locked.current) {
        setAccount(null);
        setError(null);
      }
    },
  };
}
