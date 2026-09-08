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
import { canAddManager, MAX_MANAGERS } from "../../services/staff/staffService";
import { appRoutes } from "../../constants/navigation";
import type { StaffManager } from "../../types/domain/staff";

export default function StaffManagementScreen() {
  const staff = useStaffManagement();
  const [confirmation, setConfirmation] = useState<{ manager: StaffManager; action: "remove" | "toggle" } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const busy = staff.remove.isPending || staff.setEnabled.isPending;
  const rosterAvailable = Boolean(staff.gateway.list);
  const limitReached = !canAddManager(staff.roster.data);
  const enabling = confirmation?.action === "toggle" && confirmation.manager.status === "disabled";
  const actionLabel = confirmation?.action === "remove" ? "Remove" : enabling ? "Enable" : "Disable";
  async function confirm() {
    if (!confirmation || busy) return;
    setError(""); setNotice("");
    try {
      if (confirmation.action === "remove") await staff.remove.mutateAsync(confirmation.manager.id);
      else await staff.setEnabled.mutateAsync({ id: confirmation.manager.id, enabled: enabling });
      setNotice(confirmation.action === "remove" ? "Manager removed." : enabling ? "Manager enabled." : "Manager disabled.");
      setConfirmation(null);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Manager could not be updated."); setConfirmation(null); }
  }
  return <Screen className="bg-surface"><ModuleHeader title="Staff management" eyebrow="Account owner" leading={<SecondaryBackButton />} />
    <ScrollView className="mt-6" contentContainerClassName="gap-4 pb-8">
      <View className="gap-2 rounded-3xl bg-white p-5">
        <Text className="font-ralewayExtraBold text-xl">Property managers</Text>
        <Text className="text-description">{staff.roster.data ? `${staff.roster.data.total} of ${MAX_MANAGERS} manager accounts` : `Up to ${MAX_MANAGERS} manager accounts`}</Text>
        <Text className="text-description">Invited and disabled accounts count toward the limit. Remove an account to free a place.</Text>
      </View>
      {(error || staff.roster.error) && <Text accessibilityRole="alert" className="rounded-2xl bg-dangerSurface p-4 text-danger">{error || staff.roster.error?.message}</Text>}
      {notice ? <Text accessibilityRole="alert" className="rounded-2xl bg-successSurface p-4 text-description">{notice}</Text> : null}
      {rosterAvailable ? <>
        <StaffActionButton label="Refresh managers" pending={staff.roster.isFetching} onPress={() => void staff.roster.refetch()} />
        {staff.roster.isPending ? <Text>Loading managers…</Text> : staff.roster.data?.managers.map((manager) =>
          <StaffManagerCard key={manager.id} manager={manager} gateway={staff.gateway} busy={busy}
            onEdit={() => router.push({ pathname: appRoutes.secondary.staffManagerForm, params: { managerId: manager.id } })}
            onToggle={() => setConfirmation({ manager, action: "toggle" })} onRemove={() => setConfirmation({ manager, action: "remove" })} />)}
        {staff.roster.data?.total === 0 && <Text className="text-description">No managers yet. Add someone to help manage your properties.</Text>}
        {staff.roster.data && !staff.roster.data.complete && <Text className="text-description">Some managers are not included in this list. The account total still applies to the limit.</Text>}
      </> : <Text className="rounded-2xl bg-warningSurface p-4 text-description">Your account supports manager creation. Viewing and changing existing managers is not available yet.</Text>}
      {limitReached && <Text accessibilityRole="alert" className="text-description">Two-manager limit reached. Remove a manager before adding another.</Text>}
      <StaffActionButton label={staff.gateway.creationMode === "invitation" ? "Invite manager" : "Create manager"}
        disabled={limitReached || busy || rosterAvailable && (staff.roster.isPending || staff.roster.isError)}
        onPress={() => router.push(appRoutes.secondary.staffManagerForm)} />
    </ScrollView>
    <ConfirmationModal visible={Boolean(confirmation)} title={`${actionLabel} manager?`} confirmLabel={actionLabel} isPending={busy}
      description={confirmation?.action === "remove" ? `Remove ${confirmation.manager.name} from your staff? They will lose manager access.` : enabling
        ? `Restore ${confirmation?.manager.name}'s manager access?` : `Disable ${confirmation?.manager.name}'s manager access? Their account will still count toward the two-manager limit.`}
      onCancel={() => { if (!busy) setConfirmation(null); }} onConfirm={() => void confirm()} />
  </Screen>;
}
