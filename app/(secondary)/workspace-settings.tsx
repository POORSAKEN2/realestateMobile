import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ApiError } from "../../api/errors";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { SkeletonBlock, SkeletonGroup } from "../../components/ui/Skeleton";
import { BaseField } from "../../components/ui/fields/BaseField";
import { ChoiceField } from "../../components/ui/fields/ChoiceField";
import { DropdownField } from "../../components/ui/fields/DropdownField";
import { colors } from "../../constants/colors";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useWorkspaceSettingsForm } from "../../hooks/workspace/useWorkspaceSettingsForm";
import type { WorkspaceSettings, WorkspaceTheme } from "../../types/domain/workspaceSettings";
import { WORKSPACE_SETTING_LABELS } from "../../utils/workspaceSettings";

function FieldError({ message }: { message?: string }) {
  return message ? <Text className="mt-1 text-xs font-ralewaySemiBold text-danger">{message}</Text> : null;
}

export default function WorkspaceSettingsScreen() {
  const form = useWorkspaceSettingsForm();
  const snackbar = useSnackbar();
  const [confirming, setConfirming] = useState(false);
  const options = form.query.data?.options;
  const changedKeys = Object.keys(form.changes) as (keyof WorkspaceSettings)[];

  async function confirmSave() {
    try {
      await form.save();
      setConfirming(false);
      snackbar.show("Workspace settings saved.");
    } catch (error) {
      setConfirming(false);
      snackbar.show(error instanceof ApiError ? error.message : "Could not save workspace settings.");
    }
  }

  if (form.query.isLoading || !form.draft || !options) {
    return (
      <Screen><ModuleHeader eyebrow="Administration" leading={<SecondaryBackButton />} title="Workspace Settings" />
        <SkeletonGroup accessibilityLabel="Loading workspace settings" className="mt-8 gap-4">
          {[1, 2, 3, 4].map(item => <SkeletonBlock key={item} className="h-24 w-full rounded-2xl" />)}
        </SkeletonGroup>
      </Screen>
    );
  }

  if (form.query.isError) {
    return (
      <Screen><ModuleHeader eyebrow="Administration" leading={<SecondaryBackButton />} title="Workspace Settings" />
        <View className="mt-8 rounded-2xl border border-danger/30 bg-dangerSurface p-5">
          <Text className="font-ralewayExtraBold text-textPrimary">Settings unavailable</Text>
          <Text className="mt-1 text-sm text-description">{form.query.error instanceof Error ? form.query.error.message : "Try again."}</Text>
          <TouchableOpacity className="mt-4 self-start rounded-xl bg-primary px-5 py-3" onPress={() => form.query.refetch()}>
            <Text className="font-ralewayExtraBold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const draft = form.draft;
  return (
    <Screen className="bg-surface">
      <ModuleHeader eyebrow="Administration" leading={<SecondaryBackButton />} title="Workspace Settings" supportingText="Account-wide identity and presentation defaults" />
      <View className="mt-4 flex-row items-center justify-between">
        <Text className={`text-xs font-ralewayExtraBold ${form.isDirty ? "text-warning" : "text-success"}`}>
          {form.isDirty ? `${changedKeys.length} unsaved change${changedKeys.length === 1 ? "" : "s"}` : "All changes saved"}
        </Text>
        {form.isDirty ? <TouchableOpacity onPress={form.discard}><Text className="text-xs font-ralewayExtraBold text-primary">Discard</Text></TouchableOpacity> : null}
      </View>
      <ScrollView className="-mx-6 mt-3 flex-1" contentContainerClassName="gap-5 px-6 pb-28" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="rounded-[24px] border border-primary/20 bg-panel p-5">
          <Text className="mb-4 font-ralewayExtraBold text-lg text-textPrimary">Identity</Text>
          <BaseField label="Workspace name" value={draft.appName} onChangeText={value => form.change("appName", value)} required maxLength={80} />
          <FieldError message={form.errors.appName} />
        </View>
        <View className="gap-4 rounded-[24px] border border-primary/20 bg-panel p-5">
          <Text className="font-ralewayExtraBold text-lg text-textPrimary">Regional</Text>
          <DropdownField label="Currency" value={draft.currency} options={options.currencies} onSelect={value => form.change("currency", value)} required />
          <FieldError message={form.errors.currency} />
          <DropdownField label="Locale" subtitle="Controls formatting only; it does not translate content." value={draft.locale} options={options.locales} onSelect={value => form.change("locale", value)} required />
          <FieldError message={form.errors.locale} />
          <DropdownField label="Date format" value={draft.dateFormat} options={options.dateFormats} onSelect={value => form.change("dateFormat", value)} required />
          <FieldError message={form.errors.dateFormat} />
        </View>
        <View className="rounded-[24px] border border-primary/20 bg-panel p-5">
          <Text className="mb-4 font-ralewayExtraBold text-lg text-textPrimary">Appearance</Text>
          <ChoiceField label="Theme" variant="segmented" value={draft.theme} options={options.themes as { label: string; value: WorkspaceTheme }[]} onChange={value => form.change("theme", value as WorkspaceTheme)} />
          <FieldError message={form.errors.theme} />
        </View>
        <View className="rounded-[24px] border border-primary/20 bg-panel p-5">
          <Text className="mb-4 font-ralewayExtraBold text-lg text-textPrimary">Dashboard map</Text>
          <DropdownField label="Default location" value={draft.defaultDashboardLocation} options={options.locations} onSelect={value => form.change("defaultDashboardLocation", value)} required />
          <FieldError message={form.errors.defaultDashboardLocation} />
          <Text className="mt-3 text-xs leading-5 text-description">Used when no personal location or mapped portfolio bounds are available.</Text>
        </View>
      </ScrollView>
      <View className="absolute bottom-5 left-6 right-6">
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: !form.isDirty || !form.isValid, busy: form.mutation.isPending }} className={`h-14 items-center justify-center rounded-2xl bg-primary ${!form.isDirty || !form.isValid ? "opacity-40" : ""}`} disabled={!form.isDirty || !form.isValid || form.mutation.isPending} onPress={() => setConfirming(true)}>
          {form.mutation.isPending ? <ActivityIndicator color={colors.whitePrimary} /> : <Text className="font-ralewayExtraBold text-white">Save changes</Text>}
        </TouchableOpacity>
      </View>
      <ConfirmationModal visible={confirming} title="Save workspace settings?" description={`Update ${changedKeys.map(key => WORKSPACE_SETTING_LABELS[key]).join(", ")}. Changes apply across this account.`} confirmLabel="Save" isPending={form.mutation.isPending} onCancel={() => setConfirming(false)} onConfirm={confirmSave} />
      <ScreenSnackbar message={snackbar.message} onDismiss={snackbar.dismiss} />
    </Screen>
  );
}
