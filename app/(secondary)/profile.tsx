import { router } from "expo-router";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import { ProfileAccountActions } from "../../components/profile/ProfileAccountActions";
import { ProfileDetailsForm } from "../../components/profile/ProfileDetailsForm";
import { ProfileSaveButton } from "../../components/profile/ProfileSaveButton";
import { ProfileSummaryCard } from "../../components/profile/ProfileSummaryCard";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useProfileController } from "../../hooks/profile/useProfileController";
import { useSnackbar } from "../../hooks/useSnackbar";
import { appRoutes } from "../../constants/navigation";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";

type ProfileScreenProps = {
  navigationLevel?: "primary" | "secondary";
};

export function ProfileScreen({
  navigationLevel = "secondary",
}: ProfileScreenProps) {
  const profile = useProfileController();
  const profileSnackbar = useSnackbar();
  const isPrimary = navigationLevel === "primary";

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
    <Screen
      bottomInset={isPrimary ? "tab-bar" : "safe-area"}
      className="bg-surface"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <SecondaryBackButton
          accessibilityLabel="Back from account details"
          variant="secondary"
        />

        <View className="h-3" />
        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ProfileSummaryCard
            completion={profile.completion}
            email={profile.email}
            imageUri={profile.form.imageUri}
            jobTitle={profile.form.jobTitle}
            name={profile.form.fullName}
            onChangePhoto={handleChangePhoto}
            disabled={profile.isSaving}
          />
          <ProfileDetailsForm
            errors={profile.validationErrors}
            onChange={profile.updateField}
            values={profile.form}
            disabled={profile.isSaving}
          />
          {!profile.hasChanges ? (
            <ProfileSaveButton
              disabled={profile.saveDisabled}
              hasChanges={profile.hasChanges}
              isSaving={profile.isSaving}
              onPress={handleSave}
              onDiscard={profile.discardChanges}
            />
          ) : null}
          <ProfileAccountActions
            onOpenAdditionalSettings={() =>
              router.push(appRoutes.secondary.settings)
            }
            onSignOut={handleSignOut}
            disabled={profile.isSaving}
          />
        </ScrollView>
        {profile.hasChanges ? (
          <View className="border-t border-primary/15 bg-surface pt-3">
            <ProfileSaveButton
              disabled={profile.saveDisabled}
              hasChanges={profile.hasChanges}
              isSaving={profile.isSaving}
              onPress={() => {
                Keyboard.dismiss();
                void handleSave();
              }}
              onDiscard={() =>
                Alert.alert(
                  "Discard changes?",
                  "Your unsaved profile edits and photo selection will be removed.",
                  [
                    { text: "Keep editing", style: "cancel" },
                    {
                      text: "Discard",
                      style: "destructive",
                      onPress: () => {
                        Keyboard.dismiss();
                        profile.discardChanges();
                      },
                    },
                  ],
                )
              }
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ScreenSnackbar
        message={profileSnackbar.message}
        onDismiss={profileSnackbar.dismiss}
        placement="screen-bottom"
      />
    </Screen>
  );
}

export default ProfileScreen;
