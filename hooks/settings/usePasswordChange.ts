import { useState } from "react";
import { changePassword } from "../../api/user";
import {
  validatePasswordChange,
  type PasswordChangeForm,
  type PasswordChangeErrors,
} from "../../utils/settings/passwordChange";

const empty: PasswordChangeForm = { current: "", next: "", confirm: "" };

export function usePasswordChange() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function update(field: keyof PasswordChangeForm, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError("");
  }
  function reset() {
    setValues(empty);
    setErrors({});
    setError("");
  }
  async function submit() {
    if (saving) return false;
    const nextErrors = validatePasswordChange(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return false;
    setSaving(true);
    setError("");
    try {
      await changePassword({
        current_password: values.current,
        password: values.next,
        password_confirmation: values.confirm,
      });
      reset();
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to update password.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  return { values, errors, error, saving, update, reset, submit };
}
