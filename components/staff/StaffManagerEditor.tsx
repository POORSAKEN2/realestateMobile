import { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "../../api/properties";
import type {
  CreateStaffManagerPayload,
  ManagerPermissionGroup,
  StaffGateway,
  StaffManager,
} from "../../types/domain/staff";
import { isAuthUser } from "../../utils/profile/profileForm";
import { useAuth } from "../../hooks/useAuth";
import { validateManagerDetails } from "../../services/staff/staffService";
import { resolveManagerEditorPermissions } from "../../services/staff/managerPermissionDefaults";
import { StaffActionButton } from "./StaffActionButton";
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
  onRetry,
  retrying = false,
  onSubmit,
}: {
  gateway: StaffGateway;
  manager?: StaffManager;
  pending: boolean;
  disabled: boolean;
  error?: string;
  permissionGroups: ManagerPermissionGroup[];
  onCancel: () => void;
  onRetry?: () => void;
  retrying?: boolean;
  onSubmit: (payload: CreateStaffManagerPayload) => Promise<void>;
}) {
  const { session } = useAuth();
  const [name, setName] = useState(manager?.name ?? "");
  const [email, setEmail] = useState(manager?.email ?? "");
  const [propertyIds, setPropertyIds] = useState(manager?.propertyIds ?? []);
  const [selectedPermissions, setPermissions] = useState<string[] | undefined>(
    manager?.permissions,
  );
  const permissions = useMemo(
    () =>
      resolveManagerEditorPermissions(permissionGroups, selectedPermissions),
    [permissionGroups, selectedPermissions],
  );
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const busy = pending || isSubmitting;
  const [validationError, setValidationError] = useState("");
  const properties = useQuery({
    queryKey: [
      "staff-property-options",
      isAuthUser(session?.user) ? session.user.id : undefined,
    ],
    queryFn: () => fetchProperties(session?.accessToken),
    enabled: gateway.supportsAssignments,
  });
  async function submit() {
    if (
      submitting.current ||
      busy ||
      disabled ||
      (gateway.supportsAssignments &&
        (properties.isPending || properties.isError))
    )
      return;
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
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
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
        {error && onRetry ? (
          <StaffActionButton
            label="Retry staff information"
            pending={retrying}
            disabled={busy}
            onPress={onRetry}
          />
        ) : null}
        <FormSection
          title="Manager details"
          description={
            manager
              ? "Update manager details and access. The Manager role is fixed."
              : "Send an invitation. Access begins only after acceptance; pending invitations reserve a staff seat."
          }
          icon="account-outline"
          variant="card"
        >
          <BaseField
            label="Full name"
            value={name}
            onChangeText={setName}
            required
            variant="filled"
            editable={!busy}
          />
          <BaseField
            label="Email"
            value={email}
            onChangeText={setEmail}
            required
            autoCapitalize="none"
            keyboardType="email-address"
            variant="filled"
            editable={!busy}
          />
        </FormSection>
        {gateway.supportsAssignments ? (
          properties.isPending ? (
            <Text>Loading properties…</Text>
          ) : properties.isError ? (
            <View className="gap-3 rounded-2xl bg-dangerSurface p-4">
              <Text accessibilityRole="alert" className="text-danger">
                Properties could not be loaded. Your selections are preserved.
              </Text>
              <StaffActionButton
                label="Retry properties"
                pending={properties.isFetching}
                onPress={() => void properties.refetch()}
              />
            </View>
          ) : (
            <View pointerEvents={busy ? "none" : "auto"}>
              <PropertyAssignmentFields
                disabled={busy}
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
          <View pointerEvents={busy ? "none" : "auto"}>
            <ManagerPermissionFields
              disabled={busy}
              groups={permissionGroups}
              permissions={permissions}
              onChange={setPermissions}
            />
          </View>
        )}
      </ScrollView>
      <FormActionRow
        isPending={busy}
        onCancel={onCancel}
        onSubmit={() => void submit()}
        submitDisabled={
          disabled ||
          (gateway.supportsAssignments &&
            (properties.isPending || properties.isError))
        }
        submitText={manager ? "Save changes" : "Send invitation"}
      />
    </KeyboardAvoidingView>
  );
}
