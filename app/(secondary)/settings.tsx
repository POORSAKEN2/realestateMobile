import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { AccountDeletionCard } from "../../components/account/AccountDeletionCard";
import { SupportPreviewLauncher } from "../../components/support-preview/SupportPreviewLauncher";
import { SettingsWorkspaceSection } from "../../components/settings/SettingsWorkspaceSection";
import { SettingsPasswordCard } from "../../components/settings/SettingsPasswordCard";
import { SettingsPrivacySection } from "../../components/settings/SettingsPrivacySection";
import { OnboardingPreviewCard } from "../../components/settings/OnboardingPreviewCard";

export default function SettingsScreen() {
  return (
    <Screen bottomInset="safe-area" className="bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="pb-3">
          <ModuleHeader
            eyebrow="Account"
            leading={
              <SecondaryBackButton
                accessibilityLabel="Back from settings"
                variant="secondary"
              />
            }
            title="Settings"
            supportingText="Workspace, security, and privacy."
          />
        </View>
        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <SettingsWorkspaceSection />
          <View className="mt-6">
            <SettingsPasswordCard />
          </View>
          <SettingsPrivacySection />
          <AccountDeletionCard />
          <OnboardingPreviewCard />
          <View className="mt-4">
            <SupportPreviewLauncher />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
