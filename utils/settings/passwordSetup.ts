export type PasswordSetupValues = { next: string; confirm: string };
export type PasswordSetupErrors = Partial<
  Record<keyof PasswordSetupValues, string>
>;

export function validatePasswordSetup(
  values: PasswordSetupValues,
): PasswordSetupErrors {
  const errors: PasswordSetupErrors = {};
  if (!values.next) errors.next = "Enter a new password.";
  else if (values.next.length < 8) errors.next = "Use at least 8 characters.";
  else if (values.next.length > 1024)
    errors.next = "Use no more than 1024 characters.";
  if (!values.confirm) errors.confirm = "Confirm your password.";
  else if (values.next !== values.confirm)
    errors.confirm = "Passwords do not match.";
  return errors;
}
