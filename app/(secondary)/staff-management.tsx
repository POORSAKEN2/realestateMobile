import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { StaffManagerCard } from "../../components/staff/StaffManagerCard";
import { StaffActionButton } from "../../components/staff/StaffActionButton";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { useStaffManagement } from "../../hooks/api/useStaffManagement";
import { canAddManager } from "../../services/staff/staffService";
import { appRoutes } from "../../constants/navigation";
import type { StaffManager } from "../../types/domain/staff";

export default function StaffManagementScreen() {
  const staff = useStaffManagement();
  const [confirmation, setConfirmation] = useState<{
    manager: StaffManager;
    action: "remove" | "revoke" | "toggle";
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const busy =
    staff.remove.isPending ||
    staff.revoke.isPending ||
    staff.resend.isPending ||
    staff.setEnabled.isPending;
  const rosterAvailable = Boolean(staff.gateway.list);
  const users = staff.entitlement.data?.limits?.users;
  const readOnly = staff.entitlement.data?.access_mode === "read_only";
  const capacity = staff.roster.data?.capacity;
  const limitReached = !canAddManager(capacity);
  const enabling =
    confirmation?.action === "toggle" &&
    confirmation.manager.status === "disabled";
  const actionLabel =
    confirmation?.action === "remove"
      ? "Remove"
      : confirmation?.action === "revoke"
        ? "Revoke"
        : enabling
          ? "Enable"
          : "Disable";
  async function confirm() {
    if (!confirmation || busy) return;
    setError("");
    setNotice("");
    try {
      if (confirmation.action === "remove")
        await staff.remove.mutateAsync(confirmation.manager.id);
      else if (confirmation.action === "revoke")
        await staff.revoke.mutateAsync(confirmation.manager.id);
      else
        await staff.setEnabled.mutateAsync({
          id: confirmation.manager.id,
          enabled: enabling,
        });
      setNotice(
        confirmation.action === "remove"
          ? "Manager removed."
          : confirmation.action === "revoke"
            ? "Invitation revoked."
            : enabling
              ? "Manager enabled."
              : "Manager disabled.",
      );
      setConfirmation(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Manager could not be updated.",
      );
      setConfirmation(null);
    }
  }
  return (
    <Screen className="bg-surface">
      <ModuleHeader
        title="Staff management"
        eyebrow="Account owner"
        leading={<SecondaryBackButton />}
      />
      <ScrollView className="mt-6" contentContainerClassName="gap-4 pb-8">
        <View className="gap-2 rounded-3xl bg-panel p-5">
          <Text className="font-ralewayExtraBold text-xl text-textPrimary">
            Property managers
          </Text>
          <Text className="text-description">
            {users
              ? `${users.used} of ${users.limit === null ? "unlimited" : users.limit} user accounts`
              : "Loading account limit…"}
          </Text>
          <Text className="text-description">
            The owner and disabled managers count as accounts. Pending
            invitations reserve capacity.
          </Text>
          {capacity && (
            <Text className="text-description">
              {capacity.accountsUsed} accounts + {capacity.invitationsReserved}{" "}
              reserved ·{" "}
              {capacity.remaining === null ? "Unlimited" : capacity.remaining}{" "}
              remaining
            </Text>
          )}
        </View>
        {(error || staff.roster.error || staff.entitlement.error) && (
          <Text
            accessibilityRole="alert"
            className="rounded-2xl bg-dangerSurface p-4 text-danger"
          >
            {error ||
              staff.roster.error?.message ||
              staff.entitlement.error?.message}
          </Text>
        )}
        {notice ? (
          <Text
            accessibilityRole="alert"
            className="rounded-2xl bg-successSurface p-4 text-description"
          >
            {notice}
          </Text>
        ) : null}
        {rosterAvailable ? (
          <>
            <StaffActionButton
              label="Refresh managers"
              pending={staff.roster.isFetching}
              onPress={() => {
                void staff.roster.refetch();
                void staff.entitlement.refetch();
              }}
            />
            {staff.roster.isPending ? (
              <Text className="text-description">Loading managers…</Text>
            ) : (
              staff.roster.data?.records.map((manager) => (
                <StaffManagerCard
                  key={manager.id}
                  manager={manager}
                  gateway={staff.gateway}
                  busy={busy || readOnly}
                  onEdit={() =>
                    router.push({
                      pathname: appRoutes.secondary.staffManagerForm,
                      params: { managerId: manager.id },
                    })
                  }
                  onResend={async () => {
                    setError("");
                    setNotice("");
                    try {
                      await staff.resend.mutateAsync(manager.id);
                      setNotice("Invitation queued for delivery.");
                    } catch (failure) {
                      setError(
                        failure instanceof Error
                          ? failure.message
                          : "Invitation could not be resent.",
                      );
                    }
                  }}
                  onToggle={() =>
                    setConfirmation({ manager, action: "toggle" })
                  }
                  onRemove={() =>
                    setConfirmation({
                      manager,
                      action:
                        manager.kind === "invitation" ? "revoke" : "remove",
                    })
                  }
                />
              ))
            )}
            {staff.roster.data?.records.length === 0 && (
              <Text className="text-description">
                No managers or invitations yet.
              </Text>
            )}
            {staff.roster.data && !staff.roster.data.complete && (
              <Text className="text-description">
                Some managers are not included in this list. The account total
                still applies to the limit.
              </Text>
            )}
          </>
        ) : (
          <Text className="rounded-2xl bg-warningSurface p-4 text-description">
            Your account supports manager creation. Viewing and changing
            existing managers is not available yet.
          </Text>
        )}
        {limitReached && (
          <Text accessibilityRole="alert" className="text-description">
            {readOnly
              ? "Subscription inactive. Subscribe to resume staff changes."
              : users
                ? "User limit reached. Remove a manager or change plans before adding another."
                : "Account limits must be verified before adding a manager."}
          </Text>
        )}
        <StaffActionButton
          label="Invite manager"
          disabled={
            limitReached ||
            busy ||
            (rosterAvailable &&
              (staff.roster.isPending || staff.roster.isError))
          }
          onPress={() => router.push(appRoutes.secondary.staffManagerForm)}
        />
      </ScrollView>
      <ConfirmationModal
        visible={Boolean(confirmation)}
        title={`${actionLabel} manager?`}
        confirmLabel={actionLabel}
        isPending={busy}
        description={
          confirmation?.action === "remove"
            ? `Remove ${confirmation.manager.name} from your staff? They will lose manager access.`
            : confirmation?.action === "revoke"
              ? `Revoke ${confirmation?.manager.name}'s invitation? Its link will stop working and the capacity reservation will be released.`
              : enabling
                ? `Restore ${confirmation?.manager.name}'s manager access?`
                : `Disable ${confirmation?.manager.name}'s manager access? Their account will still count toward the plan user limit.`
        }
        onCancel={() => {
          if (!busy) setConfirmation(null);
        }}
        onConfirm={() => void confirm()}
      />
    </Screen>
  );
}
