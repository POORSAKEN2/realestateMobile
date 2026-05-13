export type AuthResponse = {
  data?: {
    access_token?: string;
    user?: unknown;
    onboarding?: unknown;
  };
  message?: string;
};

export type AuthUser = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  job_title?: string;
  jobTitle?: string;
  company?: string;
  phone?: string;
  profile_image?: string;
  profile_image_url?: string;
  profileImage?: string;
  avatar?: string;
};

export type AuthSession = {
  accessToken?: string;
  user?: unknown;
  onboarding?: unknown;
};

export type AuthContextValue = {
  session: AuthSession | null;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  completeOnboarding: () => void;
  signIn: (session?: AuthSession) => void;
  signOut: () => void;
};

export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company: string;
};
