import { useMemo, useState } from "react";

import { updateUserProfile } from "../../api/user";
import { selectProfileImage } from "../../services/profileImagePicker";
import type {
  EditableProfileField,
  ProfileForm,
  ProfileImageGateway,
  ProfileImageUpload,
  ProfileSaveResult,
  ProfileUpdateGateway,
  ProfileValidationErrors,
} from "../../types";
import {
  createProfileForm,
  formsMatch,
  getProfileCompletion,
  isAuthUser,
  mergeUpdatedProfile,
  validateProfileForm,
} from "../../utils/profile/profileForm";
import { useAuth } from "../useAuth";

export type ProfileControllerDependencies = {
  updateProfile: ProfileUpdateGateway;
  selectImage: ProfileImageGateway;
};

const defaultDependencies: ProfileControllerDependencies = {
  updateProfile: updateUserProfile,
  selectImage: selectProfileImage,
};

export function useProfileController(
  dependencies: ProfileControllerDependencies = defaultDependencies,
) {
  const { session, signIn, signOut } = useAuth();
  const user = useMemo(
    () => (isAuthUser(session?.user) ? session.user : null),
    [session?.user],
  );
  const initialForm = useMemo(() => createProfileForm(user), [user]);

  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(initialForm);
  const [selectedImage, setSelectedImage] = useState<ProfileImageUpload | null>(
    null,
  );
  const [validationErrors, setValidationErrors] =
    useState<ProfileValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const completion = useMemo(() => getProfileCompletion(form), [form]);
  const hasChanges = selectedImage !== null || !formsMatch(form, savedForm);

  function updateField(field: EditableProfileField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function chooseProfileImage() {
    const result = await dependencies.selectImage();

    if (result.status === "selected") {
      setSelectedImage(result.image);
      setForm((current) => ({ ...current, imageUri: result.image.uri }));
    }

    return result.status;
  }

  async function saveProfile(): Promise<ProfileSaveResult> {
    const errors = validateProfileForm(form);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return { status: "invalid" };
    }

    if (!session?.accessToken) {
      return { status: "session-expired" };
    }

    setIsSaving(true);

    try {
      const updatedUser = await dependencies.updateProfile(
        {
          name: form.fullName.trim(),
          company: form.companyName.trim(),
          role: form.jobTitle.trim(),
          phone: form.phoneNumber.trim(),
          profileImage: selectedImage,
        },
        session.accessToken,
      );
      const nextUser = mergeUpdatedProfile(user, updatedUser, form);
      const nextForm = createProfileForm(nextUser);

      signIn({ ...session, user: nextUser });
      setForm(nextForm);
      setSavedForm(nextForm);
      setSelectedImage(null);
      setValidationErrors({});

      return { status: "saved" };
    } catch (error) {
      return {
        status: "failed",
        message:
          error instanceof Error
            ? error.message
            : "Profile update failed. Please try again.",
      };
    } finally {
      setIsSaving(false);
    }
  }

  return {
    chooseProfileImage,
    completion,
    email: user?.email?.trim(),
    form,
    hasChanges,
    isSaving,
    saveDisabled: isSaving || !hasChanges,
    saveProfile,
    signOut,
    updateField,
    validationErrors,
  };
}
