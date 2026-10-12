import type { AccessSnapshot } from "./access";
export type AuthResponse = {
  data?: {
    access_token?: string;
    auth_method?: "password" | "apple";
    apple_user_id?: string | null;
    account_created?: boolean;
    user?: unknown;
    onboarding?: unknown;
    permissions?: string[];
    assigned_property_ids?: Array<string | number>;
    property_permissions?: Record<string, string[]>;
    deletion_recovery?: { cancelled: boolean; scope: "user" | "tenant" } | null;
  };
  message?: string;
};

export type AuthUser = {
  access?: AccessSnapshot;
  property_permissions?: Record<string, string[]>;
  permissions?: string[];
  assigned_property_ids?: Array<string | number>;
  tenant_id?: string | number;
  tenantId?: string | number;
  id?: string | number;
  name?: string;
  email?: string;
  has_password?: boolean;
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
  authMethod?: "password" | "apple";
  appleUserId?: string;
  profileSetupNoticePending?: boolean;
  user?: unknown;
  onboarding?: unknown;
  deletionRecovery?: { cancelled: boolean; scope: "user" | "tenant" } | null;
};

export type AuthContextValue = {
  session: AuthSession | null;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
  setOnboardingCompleted: (completed: boolean) => void;
  signIn: (session?: AuthSession) => void;
  signInPersisted: (session: AuthSession) => Promise<void>;
  signOut: () => void;
};

export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company: string;
  otp_code: string;
};

export type RegistrationDraft = {
  email: string;
  password: string;
  verificationCode: string;
  firstName: string;
  lastName: string;
  company: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp_code: string;
  password: string;
  password_confirmation: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

export type AccountDeletionRequestPayload = {
  reason?: string;
  confirmation: boolean;
  current_password?: string;
  apple_reauth_token?: string;
};
