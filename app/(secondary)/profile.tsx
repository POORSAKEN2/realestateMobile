import { router } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { ProfileAccountActions } from "../../components/profile/ProfileAccountActions";
import { ProfileDetailsForm } from "../../components/profile/ProfileDetailsForm";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { ProfileSaveButton } from "../../components/profile/ProfileSaveButton";
import { ProfileSummaryCard } from "../../components/profile/ProfileSummaryCard";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useProfileController } from "../../hooks/profile/useProfileController";
import { useSnackbar } from "../../hooks/useSnackbar";
import { appRoutes } from "../../constants/navigation";

export default function ProfileScreen() {
  const profile = useProfileController();
  const profileSnackbar = useSnackbar();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(appRoutes.primary.dashboard);
  }

  async function handleChangePhoto() {
    const status = await profile.chooseProfileImage();

    if (status === "permission-denied") {
      Alert.alert(
        "Photo access needed",
        "Allow photo library access in Settings to choose a profile photo.",
      );
    }
  }

  async function handleSave() {
    const result = await profile.saveProfile();

    if (result.status === "saved") {
      profileSnackbar.show("Profile updated.");
      return;
    }

    if (result.status === "session-expired") {
      Alert.alert(
        "Session expired",
        "Please sign in again before updating your profile.",
      );
      return;
    }

    if (result.status === "failed") {
      Alert.alert("Couldn’t save changes", result.message);
    }
  }

  function handleSignOut() {
    Alert.alert(
      "Sign out?",
      "You’ll need to sign in again to manage your properties.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            profile.signOut();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  }

  return (
    <Screen className="bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ProfileHeader onBack={handleBack} />

        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProfileSummaryCard
            completion={profile.completion}
            email={profile.email}
            imageUri={profile.form.imageUri}
            jobTitle={profile.form.jobTitle}
            name={profile.form.fullName}
            onChangePhoto={handleChangePhoto}
          />
          <ProfileDetailsForm
            errors={profile.validationErrors}
            onChange={profile.updateField}
            values={profile.form}
          />
          <ProfileSaveButton
            disabled={profile.saveDisabled}
            hasChanges={profile.hasChanges}
            isSaving={profile.isSaving}
            onPress={handleSave}
          />
          <ProfileAccountActions
            onOpenSecurity={() => router.push(appRoutes.secondary.settings)}
            onSignOut={handleSignOut}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ScreenSnackbar
        message={profileSnackbar.message}
        onDismiss={profileSnackbar.dismiss}
        placement="screen-bottom"
      />
    </Screen>
  );
}
