import type {
  AuthUser,
  ProfileCompletion,
  ProfileForm,
  ProfileValidationErrors,
} from "../../types";

const COMPLETION_FIELDS: Array<{
  label: string;
  select: (form: ProfileForm) => string;
}> = [
  { label: "name", select: (form) => form.fullName },
  { label: "company", select: (form) => form.companyName },
  { label: "job title", select: (form) => form.jobTitle },
  { label: "phone", select: (form) => form.phoneNumber },
  { label: "photo", select: (form) => form.imageUri },
];

export function isAuthUser(value: unknown): value is AuthUser {
  return typeof value === "object" && value !== null;
}

export function formatRole(role?: string) {
  if (!role) return "";

  return role
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "RE";
}

export function getProfileImageUri(user?: AuthUser | null) {
  return (
    user?.profile_image_url ||
    user?.profile_image ||
    user?.profileImage ||
    user?.avatar ||
    ""
  );
}

export function createProfileForm(user?: AuthUser | null): ProfileForm {
  return {
    fullName: user?.name?.trim() || "",
    companyName: user?.company?.trim() || "",
    jobTitle: formatRole(user?.job_title || user?.jobTitle || user?.role),
    phoneNumber: user?.phone?.trim() || "",
    imageUri: getProfileImageUri(user),
  };
}

export function formsMatch(first: ProfileForm, second: ProfileForm) {
  return (Object.keys(first) as Array<keyof ProfileForm>).every(
    (key) => first[key] === second[key],
  );
}

export function getProfileCompletion(form: ProfileForm): ProfileCompletion {
  const completionItems = COMPLETION_FIELDS.map((field) => ({
    label: field.label,
    complete: Boolean(field.select(form).trim()),
  }));
  const completeCount = completionItems.filter((item) => item.complete).length;

  return {
    percent: Math.round((completeCount / completionItems.length) * 100),
    nextMissingItem: completionItems.find((item) => !item.complete)?.label,
  };
}

export function validateProfileForm(form: ProfileForm) {
  const errors: ProfileValidationErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = "Enter your full name.";
  }

  return errors;
}

export function mergeUpdatedProfile(
  currentUser: AuthUser | null,
  updatedUser: AuthUser,
  form: ProfileForm,
): AuthUser {
  return {
    ...(currentUser ?? {}),
    ...updatedUser,
    name: updatedUser.name?.trim() || form.fullName.trim(),
    company: updatedUser.company?.trim() || form.companyName.trim(),
    role: updatedUser.role?.trim() || form.jobTitle.trim(),
    phone: updatedUser.phone?.trim() || form.phoneNumber.trim(),
    profile_image_url:
      getProfileImageUri(updatedUser) || form.imageUri.trim() || undefined,
  };
}
