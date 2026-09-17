import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../api/properties";
import type {
  CreateStaffManagerPayload,
  ManagerPermissionGroup,
  StaffGateway,
  StaffManager,
} from "../../types/domain/staff";
import { useAuth } from "../../hooks/useAuth";
import { validateManagerDetails } from "../../services/staff/staffService";
import { resolveManagerEditorPermissions } from "../../services/staff/managerPermissionDefaults";
import { BaseField } from "../ui/fields/BaseField";
import { FormActionRow } from "../ui/forms/FormActionRow";
import { FormSection } from "../ui/forms/FormSection";
import {
  ManagerPermissionFields,
  PropertyAssignmentFields,
} from "./ManagerAccessFields";

export function StaffManagerEditor({
  gateway,
  manager,
  permissionGroups,
  pending,
  disabled,
  error,
  onCancel,
  onSubmit,
}: {
  gateway: StaffGateway;
  manager?: StaffManager;
  pending: boolean;
  disabled: boolean;
  error?: string;
  permissionGroups: ManagerPermissionGroup[];
  onCancel: () => void;
  onSubmit: (payload: CreateStaffManagerPayload) => Promise<void>;
}) {
  const { session } = useAuth();
  const [name, setName] = useState(manager?.name ?? "");
  const [email, setEmail] = useState(manager?.email ?? "");
  const [propertyIds, setPropertyIds] = useState(manager?.propertyIds ?? []);
  const [selectedPermissions, setPermissions] = useState<string[] | undefined>(
    manager?.permissions,
  );
  const permissions = resolveManagerEditorPermissions(
    permissionGroups,
    selectedPermissions,
  );
  const [validationError, setValidationError] = useState("");
  const properties = useQuery({
    queryKey: ["staff-property-options"],
    queryFn: () => fetchProperties(session?.accessToken),
    enabled: gateway.supportsAssignments,
  });
  async function submit() {
    if (pending || disabled) return;
    try {
      const payload = {
        name,
        email,
        ...(gateway.supportsAssignments ? { propertyIds } : {}),
        ...(gateway.supportsPermissions ? { permissions } : {}),
      };
      validateManagerDetails(payload);
      setValidationError("");
      await onSubmit(payload);
    } catch (failure) {
      setValidationError(
        failure instanceof Error
          ? failure.message
          : "Manager could not be saved.",
      );
    }
  }
  return (
    <View className="flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-5 pb-6"
      >
        {(validationError || error) && (
          <Text
            accessibilityRole="alert"
            className="rounded-2xl bg-dangerSurface p-4 text-danger"
          >
            {validationError || error}
          </Text>
        )}
        <FormSection
          title="Manager details"
          description="The property manager role is fixed."
          icon="account-outline"
          variant="card"
        >
          <BaseField
            label="Full name"
            value={name}
            onChangeText={setName}
            required
            variant="filled"
            editable={!pending}
          />
          <BaseField
            label="Email"
            value={email}
            onChangeText={setEmail}
            required
            autoCapitalize="none"
            keyboardType="email-address"
            variant="filled"
            editable={!pending}
          />
        </FormSection>
        {gateway.supportsAssignments ? (
          properties.isPending ? (
            <Text>Loading properties…</Text>
          ) : properties.isError ? (
            <Text
              accessibilityRole="alert"
              className="text-danger"
              onPress={() => void properties.refetch()}
            >
              Properties could not be loaded. Tap to retry.
            </Text>
          ) : (
            <View pointerEvents={pending ? "none" : "auto"}>
              <PropertyAssignmentFields
                properties={properties.data ?? []}
                selectedIds={propertyIds}
                onChange={setPropertyIds}
              />
            </View>
          )
        ) : (
          <Text className="rounded-2xl bg-warningSurface p-4 text-description">
            Property assignment is not available for your account yet. Managers
            need assigned properties to access the portfolio.
          </Text>
        )}
        {gateway.supportsPermissions && (
          <View pointerEvents={pending ? "none" : "auto"}>
            <ManagerPermissionFields
              groups={permissionGroups}
              permissions={permissions}
              onChange={setPermissions}
            />
          </View>
        )}
      </ScrollView>
      <FormActionRow
        isPending={pending}
        onCancel={onCancel}
        onSubmit={() => void submit()}
        submitDisabled={
          disabled ||
          (gateway.supportsAssignments &&
            (properties.isPending || properties.isError))
        }
        submitText={manager ? "Save changes" : "Send invitation"}
      />
    </View>
  );
}
