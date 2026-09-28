export type PasswordChangeForm = {
  current: string;
  next: string;
  confirm: string;
};

export type PasswordChangeErrors = Partial<
  Record<keyof PasswordChangeForm, string>
>;

export function validatePasswordChange(
  values: PasswordChangeForm,
): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};
  if (!values.current) errors.current = "Enter your current password.";
  if (!values.next) errors.next = "Enter a new password.";
  else if (values.next.length < 8) errors.next = "Use at least 8 characters.";
  else if (values.current === values.next)
    errors.next = "Choose a different password.";
  if (!values.confirm) errors.confirm = "Confirm your new password.";
  else if (values.next !== values.confirm)
    errors.confirm = "Passwords do not match.";
  return errors;
}
