import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { StaffManagerEditor } from "../../components/staff/StaffManagerEditor";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { useStaffManagement } from "../../hooks/api/useStaffManagement";
import { canAddManager } from "../../services/staff/staffService";
import { appRoutes } from "../../constants/navigation";

export default function StaffManagerFormScreen() {
  const params = useLocalSearchParams<{ managerId?: string | string[] }>();
  const managerId = Array.isArray(params.managerId) ? params.managerId[0] : params.managerId;
  const staff = useStaffManagement();
  const manager = staff.roster.data?.managers.find((item) => item.id === managerId);
  const title = managerId ? "Edit manager" : staff.gateway.creationMode === "invitation" ? "Invite manager" : "Create manager";
  const unavailable = managerId && (!staff.gateway.update || !staff.gateway.list || !manager);
  const limitReached = !managerId && !canAddManager(staff.roster.data);
  const loading = Boolean(staff.gateway.list) && staff.roster.isPending;
  return <Screen className="bg-surface"><ModuleHeader title={title} leading={<SecondaryBackButton />} />
    <View className="mt-6 flex-1">
      {loading ? <Text>Loading managers…</Text> : unavailable ? <Text>This manager is unavailable. Return to staff management and refresh.</Text> :
      <StaffManagerEditor key={manager?.id ?? "new"} gateway={staff.gateway} manager={manager}
        pending={staff.create.isPending || staff.update.isPending} disabled={Boolean(limitReached || staff.roster.isError)}
        error={limitReached ? "Manager limit reached (maximum 2). Remove a manager before adding another." : staff.roster.error?.message}
        onCancel={() => router.back()} onSubmit={async (payload) => {
          if (manager) {
            await staff.update.mutateAsync({ id: manager.id, payload });
            router.dismissTo(appRoutes.secondary.staffManagement);
          } else {
            const created = await staff.create.mutateAsync(payload);
            router.replace({ pathname: appRoutes.secondary.staffManagerCreated, params: {
              managerEmail: created.email, managerName: created.name, mode: staff.gateway.creationMode,
            } });
          }
        }} />}
    </View></Screen>;
}
