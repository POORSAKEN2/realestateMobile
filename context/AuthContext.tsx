import { createContext, PropsWithChildren, useMemo, useState } from "react";

import type { AuthContextValue, AuthSession } from "../types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  const value = useMemo(
    () => ({
      session,
      hasCompletedOnboarding,
      isAuthenticated,
      completeOnboarding: () => setHasCompletedOnboarding(true),
      signIn: (nextSession?: AuthSession) => {
        setSession(nextSession ?? null);
        setIsAuthenticated(true);
      },
      signOut: () => {
        setSession(null);
        setIsAuthenticated(false);
      },
    }),
    [hasCompletedOnboarding, isAuthenticated, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
