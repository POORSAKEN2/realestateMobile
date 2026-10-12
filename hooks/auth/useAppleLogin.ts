import { useEffect, useRef, useState } from "react";
import type { AuthSession } from "../../types";
import {
  requestAppleLinkCode,
  verifyAppleLinkCode,
  isAppleCancellation,
  isAppleLoginAvailable,
  loginWithApple,
  type ApplePendingAccount,
  type AppleLinkCodeResult,
} from "../../services/apple/appleAuthentication";
import { useMountedRef } from "../useMountedRef";
import {
  authErrorFeedback,
  type AuthErrorFeedback,
} from "../../utils/auth/authErrorFeedback";
import { useAuthRetryDelay } from "./useAuthRetryDelay";

export function useAppleLogin(
  onAuthenticated: (session: AuthSession) => void | Promise<void>,
) {
  const mounted = useMountedRef();
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<ApplePendingAccount | null>(null);
  const [error, setError] = useState<AuthErrorFeedback | null>(null);
  const [linkCode, setLinkCode] = useState<
    (AppleLinkCodeResult & { email: string; requestedAt: number }) | null
  >(null);
  const retryDelay = useAuthRetryDelay(error);

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
        setLinkCode(null);
        setError({
          ...authErrorFeedback(
            new Error("Apple verification expired. Start again."),
          ),
          retryable: true,
        });
      },
      (account.expires_in_seconds ?? 600) * 1000,
    );
    return () => clearTimeout(timer);
  }, [account]);

  const perform = async (
    action: (signal: AbortSignal) => Promise<void>,
    context: "signin" | "register" = "signin",
  ) => {
    if (locked.current || retryDelay > 0) return;
    locked.current = true;
    controller.current = new AbortController();
    setBusy(true);
    setError(null);
    try {
      await action(controller.current.signal);
    } catch (failure) {
      if (mounted.current && !isAppleCancellation(failure)) {
        const feedback = authErrorFeedback(failure, context);
        const restart =
          /Apple verification expired|Apple verification.*already used|Apple identity already linked/i.test(
            feedback.message,
          );
        if (restart) {
          setAccount(null);
          setLinkCode(null);
        }
        setError(restart ? { ...feedback, retryable: true } : feedback);
      }
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
    linkCode,
    error,
    retryDelay,
    clearError: () => setError(null),
    start: () =>
      perform(async (signal) => {
        setAccount(null);
        setLinkCode(null);
        const result = await loginWithApple(signal);
        if (!mounted.current) return;
        if (result.status === "authenticated")
          await onAuthenticated(result.session);
        else setAccount(result.account);
      }),
    requestCode: (email: string) =>
      perform(async (signal) => {
        if (!account) return;
        if (
          linkCode &&
          Date.now() < linkCode.requestedAt + linkCode.cooldown_seconds * 1000
        )
          return;
        const result = await requestAppleLinkCode(account, email, signal);
        if (mounted.current)
          setLinkCode({
            ...result,
            email: email.trim(),
            requestedAt: Date.now(),
          });
      }),
    verifyCode: (email: string, code: string) =>
      perform(async (signal) => {
        if (!account) return;
        const session = await verifyAppleLinkCode(account, email, code, signal);
        if (!mounted.current) return;
        await onAuthenticated(session);
        if (mounted.current) {
          setAccount(null);
          setLinkCode(null);
        }
      }),
    cancel: () => {
      if (!locked.current) {
        setAccount(null);
        setLinkCode(null);
        setError(null);
      }
    },
  };
}
