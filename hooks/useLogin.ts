import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { API_BASE_URL } from "../api/client";
import { parseApiResponse } from "../api/response";
import { sessionFromAuthResponse } from "../utils/auth/authSession";
import { restorationNotice } from "../utils/accountDeletion/accountDeletion";
import type { AuthResponse } from "../types";
import { useAuth } from "./useAuth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Login failed. Please try again.";
}

export function useLogin(initialEmail = "") {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    console.log("Attempting login at URL:", `${API_BASE_URL}/login`);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await parseApiResponse<AuthResponse>(
        response,
        "Login failed. Please check your credentials.",
      );

      const { deletion_recovery } =
        result.data ?? {};

      signIn(sessionFromAuthResponse(result));
      if (deletion_recovery?.cancelled) {
        Alert.alert(
          "Deletion cancelled",
          restorationNotice(deletion_recovery.scope),
        );
      }
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      Alert.alert("Login failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
  };
}
