import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { BaseField } from "../../components/ui/fields/BaseField";
import { FormActionRow } from "../../components/ui/forms/FormActionRow";
import { FormSection } from "../../components/ui/forms/FormSection";
import { appRoutes } from "../../constants/navigation";
import { useCreateStaffManager } from "../../hooks/api/useStaffManagement";
import { useAuth } from "../../hooks/useAuth";
import { useStaffManagerForm } from "../../hooks/staff/useStaffManagerForm";
import { canManageStaff } from "../../utils/auth/staffAccess";

export default function StaffManagerFormScreen() {
  const { session } = useAuth();
  const hasStaffAccess = canManageStaff(session?.user);
  const createManager = useCreateStaffManager(session?.accessToken);
  const form = useStaffManagerForm();

  async function submit() {
    const payload = form.validate();
    if (!payload) return;

    try {
      const manager = await createManager.mutateAsync(payload);
      router.replace({
        pathname: appRoutes.secondary.staffManagerCreated,
        params: {
          managerEmail: manager.email,
          managerName: manager.name,
        },
      });
    } catch (error) {
      form.setFormError(
        error instanceof Error
          ? error.message
          : "Manager account could not be created.",
      );
    }
  }

  if (!hasStaffAccess) {
    return (
      <Screen className="bg-surface">
        <ModuleHeader
          leading={<SecondaryBackButton variant="secondary" />}
          title="Create Manager"
        />
        <View className="mt-8">
          <ModuleEmptyState
            description="Only administrators can create property manager accounts."
            icon="lock-closed-outline"
            title="Administrator access required"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Administrator tools"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from create manager"
              variant="secondary"
            />
          }
          title="Create Manager"
        />

        <ScrollView
          className="-mx-6 mt-6 flex-1"
          contentContainerClassName="gap-5 px-6 pb-8"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {form.formError ? (
            <View className="flex-row items-start rounded-2xl border border-danger/20 bg-dangerSurface p-4">
              <Ionicons name="alert-circle-outline" color="#B42318" size={20} />
              <Text className="ml-3 flex-1 text-sm leading-5 text-danger">
                {form.formError}
              </Text>
            </View>
          ) : null}

          <FormSection
            description="The Manager role is assigned automatically and cannot be changed here."
            icon="account-outline"
            title="Manager details"
            variant="card"
          >
            <BaseField
              autoComplete="name"
              label="Full name"
              onChangeText={form.setName}
              placeholder="Enter full name"
              required
              value={form.name}
              variant="filled"
            />
            <BaseField
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={form.setEmail}
              placeholder="manager@example.com"
              required
              value={form.email}
              variant="filled"
            />
          </FormSection>

          <FormSection
            description="The account becomes active immediately. Share this password securely with the manager."
            icon="lock-outline"
            title="Temporary password"
            variant="card"
          >
            <BaseField
              autoCapitalize="none"
              autoComplete="new-password"
              label="Password"
              onChangeText={form.setPassword}
              placeholder="At least 8 characters"
              required
              secureTextEntry
              value={form.password}
              variant="filled"
            />
            <BaseField
              autoCapitalize="none"
              autoComplete="new-password"
              label="Confirm password"
              onChangeText={form.setPasswordConfirmation}
              placeholder="Enter password again"
              required
              secureTextEntry
              value={form.passwordConfirmation}
              variant="filled"
            />
          </FormSection>

          <View className="flex-row rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <Ionicons name="shield-outline" color="#8A77F4" size={20} />
            <Text className="ml-3 flex-1 text-sm leading-6 text-description">
              The backend verifies administrator access, email uniqueness, and
              the two-manager account limit.
            </Text>
          </View>
        </ScrollView>

        <View className="border-t border-primary/10 bg-surface pt-4">
          <FormActionRow
            isPending={createManager.isPending}
            onCancel={() => router.back()}
            onSubmit={() => void submit()}
            submitText="Create Manager"
          />
        </View>
      </View>
    </Screen>
  );
}
