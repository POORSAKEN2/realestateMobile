import * as SecureStore from "expo-secure-store";
import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { AuthContextValue, AuthSession } from "../types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

const AUTH_STORAGE_KEY = "realestate.auth.session";
const ONBOARDING_STORAGE_KEY = "realestate.auth.onboarding-complete";

async function getSecureItem(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    return SecureStore.getItemAsync(key);
  }

  if (typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }

  return null;
}

async function setSecureItem(key: string, value: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
}

async function deleteSecureItem(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
  }
}

function parseStoredSession(value: string | null): AuthSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as AuthSession;

    return parsed?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasCompletedOnboardingInSession(session: AuthSession | null) {
  const onboarding = session?.onboarding;
  const user = session?.user;

  if (
    isRecord(onboarding) &&
    onboarding.onboarding_complete !== undefined
  ) {
    return Boolean(onboarding.onboarding_complete);
  }

  if (isRecord(user) && user.onboarding_complete !== undefined) {
    return Boolean(user.onboarding_complete);
  }

  return false;
}

function persistSecureItem(key: string, value: string) {
  setSecureItem(key, value).catch(() => {
    // Persistence failures should not block the in-memory auth flow.
  });
}

function removeSecureItem(key: string) {
  deleteSecureItem(key).catch(() => {
    // Sign-out should still complete locally if secure storage is unavailable.
  });
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreAuthState() {
      try {
        const [storedSession, storedOnboarding] = await Promise.all([
          getSecureItem(AUTH_STORAGE_KEY),
          getSecureItem(ONBOARDING_STORAGE_KEY),
        ]);
        const restoredSession = parseStoredSession(storedSession);

        if (!isMounted) return;

        if (restoredSession) {
          setSession(restoredSession);
          setIsAuthenticated(true);
        }

        setHasCompletedOnboarding(
          storedOnboarding !== null
            ? storedOnboarding === "true"
            : hasCompletedOnboardingInSession(restoredSession),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      hasCompletedOnboarding,
      isAuthenticated,
      isLoading,
      completeOnboarding: () => {
        setHasCompletedOnboarding(true);
        persistSecureItem(ONBOARDING_STORAGE_KEY, "true");
      },
      setOnboardingCompleted: (completed: boolean) => {
        setHasCompletedOnboarding(completed);
        persistSecureItem(ONBOARDING_STORAGE_KEY, completed ? "true" : "false");
      },
      signIn: (nextSession?: AuthSession) => {
        const normalizedSession = nextSession ?? null;

        setSession(normalizedSession);
        setIsAuthenticated(Boolean(normalizedSession?.accessToken));

        if (normalizedSession?.accessToken) {
          persistSecureItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedSession));

          if (hasCompletedOnboardingInSession(normalizedSession)) {
            setHasCompletedOnboarding(true);
            persistSecureItem(ONBOARDING_STORAGE_KEY, "true");
          }
        } else {
          removeSecureItem(AUTH_STORAGE_KEY);
        }
      },
      signOut: () => {
        setSession(null);
        setIsAuthenticated(false);
        removeSecureItem(AUTH_STORAGE_KEY);
      },
    }),
    [hasCompletedOnboarding, isAuthenticated, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
