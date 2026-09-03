import { useState } from "react";

import type { CreateStaffManagerPayload } from "../../types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;

export function useStaffManagerForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): CreateStaffManagerPayload | null {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      setFormError("Enter manager full name.");
      return null;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setFormError("Enter a valid manager email address.");
      return null;
    }

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      setFormError("Password must contain at least 8 characters.");
      return null;
    }

    if (password !== passwordConfirmation) {
      setFormError("Passwords do not match.");
      return null;
    }

    setFormError(null);

    return {
      name: normalizedName,
      email: normalizedEmail,
      password,
    };
  }

  return {
    email,
    formError,
    name,
    password,
    passwordConfirmation,
    setEmail,
    setFormError,
    setName,
    setPassword,
    setPasswordConfirmation,
    validate,
  };
}
