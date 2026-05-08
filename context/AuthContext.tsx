import { createContext, PropsWithChildren, useMemo, useState } from 'react';

type AuthContextValue = {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  completeOnboarding: () => void;
  signIn: () => void;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const value = useMemo(
    () => ({
      hasCompletedOnboarding,
      isAuthenticated,
      completeOnboarding: () => setHasCompletedOnboarding(true),
      signIn: () => setIsAuthenticated(true),
      signOut: () => setIsAuthenticated(false),
    }),
    [hasCompletedOnboarding, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
