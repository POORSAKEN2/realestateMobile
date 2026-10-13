import { useMemo, useRef, useState } from "react";

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
import { getProfileAccountPresentation } from "../../utils/profile/profileAccountPresentation";

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
  const [isEditing, setIsEditing] = useState(false);
  const saving = useRef(false);

  const completion = useMemo(() => getProfileCompletion(form), [form]);
  const hasChanges = selectedImage !== null || !formsMatch(form, savedForm);

  function updateField(field: EditableProfileField, value: string) {
    if (saving.current) return;
    setForm((current) => ({ ...current, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function discardChanges() {
    if (saving.current) return;
    setForm(savedForm);
    setSelectedImage(null);
    setValidationErrors({});
    setIsEditing(false);
  }

  function beginEditing() {
    if (!saving.current) setIsEditing(true);
  }

  async function chooseProfileImage() {
    if (saving.current) return "cancelled";
    const result = await dependencies.selectImage();

    if (result.status === "selected" && !saving.current) {
      setSelectedImage(result.image);
      setForm((current) => ({ ...current, imageUri: result.image.uri }));
      setIsEditing(true);
    }

    return result.status;
  }

  async function saveProfile(): Promise<ProfileSaveResult> {
    if (saving.current)
      return {
        status: "failed",
        message: "Your profile is already being saved.",
      };
    const errors = validateProfileForm(form);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return { status: "invalid" };
    }

    if (!session?.accessToken) {
      return { status: "session-expired" };
    }

    saving.current = true;
    setIsSaving(true);

    try {
      const updatedUser = await dependencies.updateProfile(
        {
          name: form.fullName.trim(),
          company: form.companyName.trim(),
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
      setIsEditing(false);

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
      saving.current = false;
      setIsSaving(false);
    }
  }

  return {
    chooseProfileImage,
    beginEditing,
    discardChanges,
    completion,
    email: user?.email?.trim(),
    accountPresentation: getProfileAccountPresentation(
      session?.authMethod,
      user?.email,
      user?.name,
    ),
    form,
    hasChanges,
    isSaving,
    isAuthenticated: Boolean(session?.accessToken),
    isEditing,
    savedForm,
    saveDisabled: isSaving || !hasChanges,
    saveProfile,
    signOut,
    updateField,
    validationErrors,
  };
}
