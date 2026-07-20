import type { AuthUser } from "../auth";

export type ProfileForm = {
  fullName: string;
  companyName: string;
  jobTitle: string;
  phoneNumber: string;
  imageUri: string;
};

export type EditableProfileField = Exclude<keyof ProfileForm, "imageUri">;

export type ProfileImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type UpdateUserProfilePayload = {
  name: string;
  company: string;
  role: string;
  phone: string;
  profileImage?: ProfileImageUpload | null;
};

export type ProfileCompletion = {
  percent: number;
  nextMissingItem?: string;
};

export type ProfileValidationErrors = Partial<
  Record<EditableProfileField, string>
>;

export type ProfileUpdateGateway = (
  payload: UpdateUserProfilePayload,
  accessToken?: string,
) => Promise<AuthUser>;

export type ProfileImageSelection =
  | { status: "cancelled" }
  | { status: "permission-denied" }
  | { status: "selected"; image: ProfileImageUpload };

export type ProfileImageGateway = () => Promise<ProfileImageSelection>;

export type ProfileSaveResult =
  | { status: "saved" }
  | { status: "invalid" }
  | { status: "session-expired" }
  | { status: "failed"; message: string };
