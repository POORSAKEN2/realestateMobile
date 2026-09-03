import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../api/properties";
import type { CreateStaffManagerPayload, StaffGateway, StaffManager } from "../../types/domain/staff";
import { useAuth } from "../../hooks/useAuth";
import { validateManagerDetails } from "../../services/staff/staffService";
import { DEFAULT_MANAGER_PERMISSIONS } from "../../utils/staff/managerPermissions";
import { BaseField } from "../ui/fields/BaseField";
import { FormActionRow } from "../ui/forms/FormActionRow";
import { FormSection } from "../ui/forms/FormSection";
import { ManagerPermissionFields, PropertyAssignmentFields } from "./ManagerAccessFields";

export function StaffManagerEditor({ gateway, manager, pending, disabled, error, onCancel, onSubmit }: {
  gateway: StaffGateway; manager?: StaffManager; pending: boolean; disabled: boolean; error?: string;
  onCancel: () => void; onSubmit: (payload: CreateStaffManagerPayload) => Promise<void>;
}) {
  const { session } = useAuth();
  const [name, setName] = useState(manager?.name ?? "");
  const [email, setEmail] = useState(manager?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [propertyIds, setPropertyIds] = useState(manager?.propertyIds ?? []);
  const [permissions, setPermissions] = useState<string[]>(manager?.permissions ?? DEFAULT_MANAGER_PERMISSIONS);
  const [validationError, setValidationError] = useState("");
  const properties = useQuery({ queryKey: ["staff-property-options"], queryFn: () => fetchProperties(session?.accessToken), enabled: gateway.supportsAssignments });
  const needsPassword = !manager && gateway.creationMode === "account";
  async function submit() {
    if (pending || disabled) return;
    try {
      const payload = { name, email, ...(needsPassword ? { password } : {}),
        ...(gateway.supportsAssignments ? { propertyIds } : {}), ...(gateway.supportsPermissions ? { permissions } : {}) };
      validateManagerDetails(payload);
      if (needsPassword && password.length < 8) throw new Error("Password must contain at least 8 characters.");
      if (needsPassword && password !== confirmation) throw new Error("Passwords do not match.");
      setValidationError("");
      await onSubmit(payload);
    } catch (failure) { setValidationError(failure instanceof Error ? failure.message : "Manager could not be saved."); }
  }
  return <View className="flex-1"><ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 pb-6">
    {(validationError || error) && <Text accessibilityRole="alert" className="rounded-2xl bg-dangerSurface p-4 text-danger">{validationError || error}</Text>}
    <FormSection title="Manager details" description="The property manager role is fixed." icon="account-outline" variant="card">
      <BaseField label="Full name" value={name} onChangeText={setName} required variant="filled" editable={!pending} />
      <BaseField label="Email" value={email} onChangeText={setEmail} required autoCapitalize="none" keyboardType="email-address" variant="filled" editable={!pending} />
    </FormSection>
    {needsPassword && <FormSection title="Temporary password" description="Share account credentials securely with the manager." icon="lock-outline" variant="card">
      <BaseField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="new-password" variant="filled" editable={!pending} />
      <BaseField label="Confirm password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none" variant="filled" editable={!pending} />
    </FormSection>}
    {gateway.supportsAssignments ? properties.isPending ? <Text>Loading properties…</Text> : properties.isError
      ? <Text accessibilityRole="alert" className="text-danger" onPress={() => void properties.refetch()}>Properties could not be loaded. Tap to retry.</Text>
      : <View pointerEvents={pending ? "none" : "auto"}><PropertyAssignmentFields properties={properties.data ?? []} selectedIds={propertyIds} onChange={setPropertyIds} /></View>
      : <Text className="rounded-2xl bg-warningSurface p-4 text-description">Property assignment is not available for your account yet. Managers need assigned properties to access the portfolio.</Text>}
    {gateway.supportsPermissions && <View pointerEvents={pending ? "none" : "auto"}><ManagerPermissionFields permissions={permissions} onChange={setPermissions} /></View>}
  </ScrollView><FormActionRow isPending={pending} onCancel={onCancel} onSubmit={() => void submit()}
    submitDisabled={disabled || gateway.supportsAssignments && (properties.isPending || properties.isError)}
    submitText={manager ? "Save changes" : gateway.creationMode === "invitation" ? "Send invitation" : "Create manager"} />
  </View>;
}
