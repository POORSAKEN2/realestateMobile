import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert } from "react-native";

import { API_BASE_URL } from "../api/client";
import { parseApiResponse } from "../api/response";
import { normalizeUser } from "../api/user";
import type { AuthResponse, RegisterFormData } from "../types";
import { useAuth } from "./useAuth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  company: "",
};

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function getPasswordValidationMessage(password: string) {
  if (password.length < 8) {
    return "Use at least 8 characters.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Use letters and numbers for a stronger password.";
  }

  return "";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Registration failed. Please try again.";
}

export function useRegister() {
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const passwordWarning = useMemo(
    () =>
      formData.password ? getPasswordValidationMessage(formData.password) : "",
    [formData.password],
  );

  const handleChange = (name: keyof RegisterFormData, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const register = async () => {
    setIsLoading(true);
    setError(null);

    if (!formData.name.trim() || !formData.company.trim()) {
      setError("Full name and company name are required.");
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    const passwordValidationMessage = getPasswordValidationMessage(
      formData.password,
    );

    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
        }),
      });

      const result = await parseApiResponse<AuthResponse>(
        response,
        "Registration failed.",
      );

      const { access_token, user, onboarding } = result.data ?? {};

      signIn({
        accessToken: access_token,
        user: user && typeof user === "object" ? normalizeUser(user) : user,
        onboarding,
      });
      Alert.alert("Registered", "Registration successful!");
      router.replace("/");
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      Alert.alert("Registration failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    handleChange,
    isLoading,
    error,
    passwordWarning,
    register,
  };
}
