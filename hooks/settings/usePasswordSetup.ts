import { useEffect, useRef, useState } from "react";
import { useAuth } from "../useAuth";
import { useMountedRef } from "../useMountedRef";
import {
  isAppleCancellation,
  isAppleLoginAvailable,
  reauthenticateApple,
} from "../../services/apple/appleAuthentication";
import { setFirstPassword } from "../../api/passwordSetup";
import { authErrorFeedback } from "../../utils/auth/authErrorFeedback";
import {
  validatePasswordSetup,
  type PasswordSetupValues,
  type PasswordSetupErrors,
} from "../../utils/settings/passwordSetup";
import { getSessionAccess } from "../../services/access/sessionAccess";

const empty: PasswordSetupValues = { next: "", confirm: "" };

export function usePasswordSetup() {
  const { session, signInPersisted } = useAuth();
  const mounted = useMountedRef();
  const latest = useRef(session);
  latest.current = session;
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<PasswordSetupErrors>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const locked = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const authenticated = Boolean(session?.accessToken);
  const eligible = Boolean(
    session?.user &&
    typeof session.user === "object" &&
    "has_password" in session.user &&
    session.user.has_password === false,
  );
  useEffect(() => {
    void isAppleLoginAvailable()
      .then((value) => {
        if (mounted.current) setAvailable(value);
      })
      .catch(() => {
        if (mounted.current) setAvailable(false);
      });
    return () => controller.current?.abort();
  }, [mounted]);
  useEffect(() => {
    if (!authenticated) {
      controller.current?.abort();
      setValues(empty);
      setErrors({});
      setError("");
    }
  }, [authenticated]);

  function update(field: keyof PasswordSetupValues, value: string) {
    if (locked.current) return;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }
  function reset() {
    setValues(empty);
    setErrors({});
    setError("");
  }
  async function submit(): Promise<boolean> {
    if (locked.current || !available || !eligible || !session?.accessToken)
      return false;
    const validation = validatePasswordSetup(values);
    setErrors(validation);
    if (Object.keys(validation).length) return false;
    const token = session.accessToken;
    const revision = getSessionAccess().revision;
    const sameSession = () =>
      mounted.current &&
      !controller.current?.signal.aborted &&
      latest.current?.accessToken === token &&
      getSessionAccess().revision === revision;
    locked.current = true;
    const request = new AbortController();
    controller.current = request;
    setSaving(true);
    setError("");
    let receipt: string | undefined;
    try {
      receipt = await reauthenticateApple(
        "set_password",
        undefined,
        request.signal,
      );
      if (!sameSession()) return false;
      const user = await setFirstPassword(
        values.next,
        values.confirm,
        receipt,
        request.signal,
      );
      receipt = undefined;
      if (!sameSession() || !latest.current) return false;
      await signInPersisted({
        ...latest.current,
        user: { ...(latest.current.user as object), ...user },
      });
      if (!mounted.current) return false;
      reset();
      return true;
    } catch (cause) {
      if (
        mounted.current &&
        !isAppleCancellation(cause) &&
        !request.signal.aborted
      )
        setError(authErrorFeedback(cause).message);
      return false;
    } finally {
      receipt = undefined;
      locked.current = false;
      controller.current = null;
      if (mounted.current) setSaving(false);
    }
  }
  return {
    values,
    errors,
    error,
    saving,
    available,
    eligible,
    authenticated,
    hasChanges: Boolean(values.next || values.confirm),
    canSubmit:
      available === true &&
      eligible &&
      !saving &&
      Object.keys(validatePasswordSetup(values)).length === 0,
    update,
    reset,
    submit,
  };
}
