import { router } from "expo-router";
import { Keyboard, ScrollView, Text, View } from "react-native";
import { Screen } from "../../../components/ui/Screen";
import { ModuleHeader } from "../../../components/ui/ModuleHeader";
import { SecondaryBackButton } from "../../../components/navigation/SecondaryBackButton";
import { FormSection } from "../../../components/ui/forms/FormSection";
import { FormActionRow } from "../../../components/ui/forms/FormActionRow";
import { PasswordField } from "../../../components/ui/fields/PasswordField";
import { ConfirmationModal } from "../../../components/ui/ConfirmationModal";
import { usePasswordSetup } from "../../../hooks/settings/usePasswordSetup";
import { useProfileExitGuard } from "../../../hooks/profile/useProfileExitGuard";
import { useProfileKeyboardInset } from "../../../hooks/profile/useProfileKeyboardInset";

export default function SetPasswordScreen() {
  const password = usePasswordSetup();
  const keyboard = useProfileKeyboardInset();
  const exit = useProfileExitGuard({
    hasChanges: password.hasChanges && password.authenticated,
    isSaving: password.saving && password.authenticated,
    discardDescription: "Your unsaved password will be removed.",
    onDiscard: () => {
      Keyboard.dismiss();
      password.reset();
    },
  });
  const back = () =>
    exit.requestLeave(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/(secondary)/settings");
    });
  async function save() {
    if (await password.submit()) {
      Keyboard.dismiss();
      exit.leave(() =>
        router.dismissTo({
          pathname: "/(secondary)/settings",
          params: { passwordSet: "1" },
        }),
      );
    }
  }
  const unavailable = password.available === false;
  return (
    <Screen bottomInset="safe-area" className="bg-surface">
      <View
        ref={keyboard.containerRef}
        collapsable={false}
        onLayout={keyboard.onLayout}
        className="flex-1"
        style={{ paddingBottom: keyboard.bottomInset }}
      >
        <View className="pb-5">
          <ModuleHeader
            eyebrow="Security"
            title="Set password"
            titleNumberOfLines={0}
            leading={
              <SecondaryBackButton
                accessibilityLabel="Back to settings"
                disabled={password.saving}
                variant="secondary"
                navigation={{ canGoBack: () => true, back, replace: back }}
              />
            }
          />
        </View>
        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <FormSection
            title="Create a password"
            icon="shield-lock-outline"
            variant="card"
            description="Add a Terrane password to sign in with email. Apple sign-in will still work."
          >
            <View className="gap-4">
              <PasswordField
                label="New password"
                maxLength={1024}
                textContentType="newPassword"
                value={password.values.next}
                onChangeText={(value) => password.update("next", value)}
                error={password.errors.next}
                disabled={password.saving || unavailable || !password.eligible}
              />
              <PasswordField
                label="Confirm password"
                maxLength={1024}
                textContentType="newPassword"
                value={password.values.confirm}
                onChangeText={(value) => password.update("confirm", value)}
                error={password.errors.confirm}
                disabled={password.saving || unavailable || !password.eligible}
              />
              <Text className="font-ralewayMedium text-xs leading-5 text-description">
                Use at least 8 characters. Apple will verify your identity
                before saving.
              </Text>
              {unavailable ? (
                <Text
                  accessibilityRole="alert"
                  className="font-ralewayMedium text-sm leading-5 text-description"
                >
                  Setting a password requires an Apple-enabled iOS app.
                </Text>
              ) : null}
              {!password.eligible ? (
                <Text
                  accessibilityRole="alert"
                  className="font-ralewayMedium text-sm leading-5 text-description"
                >
                  Password setup is unavailable for this account. Return to
                  Settings to manage your password.
                </Text>
              ) : null}
              {password.error ? (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="font-ralewayMedium text-sm leading-5 text-danger"
                >
                  {password.error}
                </Text>
              ) : null}
            </View>
          </FormSection>
        </ScrollView>
        <View
          collapsable={false}
          style={{ flexShrink: 0 }}
          className="border-t border-textPrimary/10 bg-panel py-4"
        >
          <FormActionRow
            appearance="card"
            tone="strong"
            submitText="Set password"
            isPending={password.saving}
            submitDisabled={!password.canSubmit}
            onCancel={back}
            onSubmit={() => {
              void save();
            }}
          />
        </View>
      </View>
      <ConfirmationModal
        visible={Boolean(exit.confirmation)}
        title={exit.confirmation?.title ?? "Discard changes?"}
        description={exit.confirmation?.description ?? ""}
        confirmLabel={exit.confirmation?.confirmLabel ?? "Discard"}
        onConfirm={exit.confirm}
        onCancel={exit.cancel}
      />
    </Screen>
  );
}
