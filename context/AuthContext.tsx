import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { AppState } from "react-native";
import { fetchCurrentUser } from "../api/user";
import { ApiError } from "../api/errors";
import { getSessionAccess } from "../services/access/sessionAccess";
import { normalizeAccess } from "../utils/auth/accessAdapter";
import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setSessionAccess } from "../services/access/sessionAccess";
import type { AuthContextValue, AuthSession } from "../types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

const AUTH_STORAGE_KEY = "realestate.auth.session";
const ONBOARDING_STORAGE_KEY = "realestate.auth.onboarding-complete";

async function getSecureItem(key: string) {
  if (await SecureStore.isAvailableAsync()) return SecureStore.getItemAsync(key);
  if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  return null;
}

async function setSecureItem(key: string, value: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
}

async function deleteSecureItem(key: string) {
  if (await SecureStore.isAvailableAsync()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  if (typeof localStorage !== "undefined") localStorage.removeItem(key);
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
  if (isRecord(onboarding) && onboarding.onboarding_complete !== undefined) {
    return Boolean(onboarding.onboarding_complete);
  }
  if (isRecord(user) && user.onboarding_complete !== undefined) {
    return Boolean(user.onboarding_complete);
  }
  return false;
}

function persistSecureItem(key: string, value: string) {
  setSecureItem(key, value).catch(() => {});
}

function removeSecureItem(key: string) {
  deleteSecureItem(key).catch(() => {});
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;
    let disposed = false;
    let refreshing = false;
    async function refresh() {
      if (refreshing || !token) return;
      refreshing = true;
      const revision = getSessionAccess().revision;
      try {
        const user = await fetchCurrentUser(token);
        if (disposed || getSessionAccess().revision !== revision) return;
        const changed = JSON.stringify(normalizeAccess(user)) !== JSON.stringify(getSessionAccess().access);
        if (changed) {
          setSessionAccess(user, token);
          queryClient.clear();
        }
        setSession(previous => {
          if (previous?.accessToken !== token) return previous;
          const next = { ...previous, user };
          persistSecureItem(AUTH_STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch (error) {
        if (!disposed && getSessionAccess().revision === revision && error instanceof ApiError && [401, 403].includes(error.status)) {
          setSessionAccess(null);
          queryClient.clear();
          setSession(null);
          setIsAuthenticated(false);
          removeSecureItem(AUTH_STORAGE_KEY);
        }
      } finally { refreshing = false; }
    }
    void refresh();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 60_000);
    return () => { disposed = true; subscription.remove(); clearInterval(timer); };
  }, [session?.accessToken, queryClient]);

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
          setSessionAccess(restoredSession.user, restoredSession.accessToken);
          setSession(restoredSession);
          setIsAuthenticated(true);
        }
        setHasCompletedOnboarding(
          storedOnboarding !== null
            ? storedOnboarding === "true"
            : hasCompletedOnboardingInSession(restoredSession),
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void restoreAuthState();
    return () => { isMounted = false; };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      hasCompletedOnboarding,
      isAuthenticated,
      isLoading,
      completeOnboarding: () => {
        setHasCompletedOnboarding(true);
        persistSecureItem(ONBOARDING_STORAGE_KEY, "true");
      },
      setOnboardingCompleted: (completed) => {
        setHasCompletedOnboarding(completed);
        persistSecureItem(ONBOARDING_STORAGE_KEY, completed ? "true" : "false");
      },
      signIn: (nextSession) => {
        const normalizedSession = nextSession ?? null;
        const current = getSessionAccess();
        if (current.token !== normalizedSession?.accessToken || JSON.stringify(current.access) !== JSON.stringify(normalizeAccess(normalizedSession?.user))) {
          setSessionAccess(normalizedSession?.user, normalizedSession?.accessToken);
          queryClient.clear();
        }
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
        setSessionAccess(null);
        queryClient.clear();
        setSession(null);
        setIsAuthenticated(false);
        removeSecureItem(AUTH_STORAGE_KEY);
      },
    }),
    [hasCompletedOnboarding, isAuthenticated, isLoading, session, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
