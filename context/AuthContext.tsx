import { createContext, PropsWithChildren, useMemo, useState } from 'react';

type AuthSession = {
  accessToken?: string;
  user?: unknown;
  onboarding?: unknown;
};

type AuthContextValue = {
  session: AuthSession | null;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  completeOnboarding: () => void;
  signIn: (session?: AuthSession) => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
