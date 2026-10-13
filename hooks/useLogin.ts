import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

import { API_BASE_URL } from "../api/client";
import { parseApiResponse } from "../api/response";
import { toTransportError } from "../api/errors";
import {
  authErrorFeedback,
  type AuthErrorFeedback,
} from "../utils/auth/authErrorFeedback";
import { sessionFromAuthResponse } from "../utils/auth/authSession";
import { restorationNotice } from "../utils/accountDeletion/accountDeletion";
import type { AuthResponse } from "../types";
import { useAuth } from "./useAuth";
import { useAuthRetryDelay } from "./auth/useAuthRetryDelay";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function useLogin(initialEmail = "") {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorFeedback | null>(null);
  const retryDelay = useAuthRetryDelay(error);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (isLoading || retryDelay > 0) return;
    setIsLoading(true);
    setError(null);

    if (!isValidEmail(email)) {
      setError(
        authErrorFeedback(new Error("Please enter a valid email address.")),
      );
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError(authErrorFeedback(new Error("Password is required.")));
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
      }).catch((failure) => {
        throw toTransportError(failure);
      });

      const result = await parseApiResponse<AuthResponse>(
        response,
        "Login failed. Please check your credentials.",
      );

      const { deletion_recovery } = result.data ?? {};

      signIn(sessionFromAuthResponse(result));
      if (deletion_recovery?.cancelled) {
        Alert.alert(
          "Deletion cancelled",
          restorationNotice(deletion_recovery.scope),
        );
      }
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(authErrorFeedback(err));
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
    retryDelay,
    clearError: () => setError(null),
    handleLogin,
  };
}
