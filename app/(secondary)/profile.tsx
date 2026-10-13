import { router } from "expo-router";
import { useState } from "react";
import { Alert, Keyboard, ScrollView, View } from "react-native";

import { ProfileAccountActions } from "../../components/profile/ProfileAccountActions";
import { ProfileDetailsForm } from "../../components/profile/ProfileDetailsForm";
import { ProfileSaveButton } from "../../components/profile/ProfileSaveButton";
import { ProfileSummaryCard } from "../../components/profile/ProfileSummaryCard";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useProfileController } from "../../hooks/profile/useProfileController";
import { useProfileExitGuard } from "../../hooks/profile/useProfileExitGuard";
import { useProfileKeyboardInset } from "../../hooks/profile/useProfileKeyboardInset";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useSnackbar } from "../../hooks/useSnackbar";
import { appRoutes } from "../../constants/navigation";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";

type ProfileScreenProps = {
  navigationLevel?: "primary" | "secondary";
};

export function ProfileScreen({
  navigationLevel = "secondary",
}: ProfileScreenProps) {
  const profile = useProfileController();
  const profileSnackbar = useSnackbar();
  const [footerHeight, setFooterHeight] = useState(0);
  const exit = useProfileExitGuard({
    hasChanges: profile.hasChanges && profile.isAuthenticated,
    isSaving: profile.isSaving && profile.isAuthenticated,
    onDiscard: () => {
      Keyboard.dismiss();
      profile.discardChanges();
    },
  });
  const isPrimary = navigationLevel === "primary";
  const keyboard = useProfileKeyboardInset();

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
      profileSnackbar.show(
        "Session expired. Please sign in again before updating your profile.",
      );
      return;
    }

    if (result.status === "failed") {
      profileSnackbar.show(result.message);
    }
  }

  function handleSignOut() {
    exit.requestSignOut(() => {
      profile.signOut();
      router.replace("/(auth)/login");
    });
  }

  return (
    <Screen
      bottomInset={isPrimary ? "tab-bar" : "safe-area"}
      className="bg-surface"
    >
      <View
        ref={keyboard.containerRef}
        collapsable={false}
        className="flex-1"
        style={{ paddingBottom: keyboard.bottomInset }}
        onLayout={keyboard.onLayout}
      >
        <View className="h-3" />
        <ModuleHeader
          title="Your Profile"
          eyebrow="Account"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from account details"
              variant="secondary"
            />
          }
        />
        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-8"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <ProfileSummaryCard
            completion={profile.completion}
            account={profile.accountPresentation}
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
            savedValues={profile.savedForm}
            isEditing={profile.isEditing}
            onEdit={profile.beginEditing}
            disabled={profile.isSaving}
          />
          <ProfileAccountActions
            onOpenAdditionalSettings={() =>
              router.push(appRoutes.secondary.settings)
            }
            onSignOut={handleSignOut}
            disabled={profile.isSaving}
          />
        </ScrollView>
        {profile.isEditing ? (
          <View
            className="border-t border-textPrimary/10 bg-panel py-4"
            onLayout={(event) => {
              setFooterHeight(event.nativeEvent.layout.height);
            }}
          >
            <ProfileSaveButton
              disabled={profile.saveDisabled}
              hasChanges={profile.hasChanges}
              isSaving={profile.isSaving}
              onPress={() => {
                Keyboard.dismiss();
                void handleSave();
              }}
              onDiscard={() => exit.requestDiscard()}
            />
          </View>
        ) : null}
      </View>

      <ScreenSnackbar
        message={profileSnackbar.message}
        onDismiss={profileSnackbar.dismiss}
        placement="screen-bottom"
        bottomClearance={
          profile.isEditing ? footerHeight + keyboard.bottomInset + 24 : 0
        }
      />
      <ConfirmationModal
        visible={Boolean(exit.confirmation)}
        title={exit.confirmation?.title ?? ""}
        description={exit.confirmation?.description ?? ""}
        confirmLabel={exit.confirmation?.confirmLabel}
        isPending={profile.isSaving}
        onCancel={exit.cancel}
        onConfirm={exit.confirm}
      />
    </Screen>
  );
}

export default ProfileScreen;
