import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { useAccess } from "../../hooks/auth/useAccess";
import { ModuleLoadingState } from "../../components/ui/ModuleState";
import { StaffActionButton } from "../../components/staff/StaffActionButton";
import { StaffManagerEditor } from "../../components/staff/StaffManagerEditor";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { useStaffManagement } from "../../hooks/api/useStaffManagement";
import { canAddManager } from "../../services/staff/staffService";
import { appRoutes } from "../../constants/navigation";

export default function StaffManagerFormScreen() {
  const params = useLocalSearchParams<{ managerId?: string | string[] }>();
  const managerId = Array.isArray(params.managerId)
    ? params.managerId[0]
    : params.managerId;
  const staff = useStaffManagement();
  const { can } = useAccess();
  const allowed = can("staff.manage");
  const requestError =
    staff.roster.error?.message ||
    staff.catalog.error?.message ||
    staff.entitlement.error?.message;
  const manager = staff.roster.data?.records.find(
    (item) => item.id === managerId,
  );
  const retrying =
    staff.roster.isFetching ||
    staff.catalog.isFetching ||
    staff.entitlement.isFetching;
  const retry = () => {
    void Promise.allSettled([
      staff.roster.refetch(),
      ...(staff.gateway.catalog ? [staff.catalog.refetch()] : []),
      staff.entitlement.refetch(),
    ]);
  };
  const title = managerId
    ? manager?.kind === "invitation"
      ? "Edit invitation"
      : "Edit manager"
    : "Invite manager";
  const unavailable = managerId && (!staff.gateway.list || !manager);
  const limitReached =
    !managerId && !canAddManager(staff.roster.data?.capacity);
  const loading =
    staff.entitlement.isPending ||
    (Boolean(staff.gateway.catalog) && staff.catalog.isPending) ||
    (Boolean(staff.gateway.list) && staff.roster.isPending);
  return (
    <Screen bottomInset="safe-area" className="bg-surface">
      <ModuleHeader title={title} leading={<SecondaryBackButton />} />
      <View className="mt-6 flex-1">
        {!allowed ? (
          <Text
            accessibilityRole="alert"
            className="rounded-2xl bg-warningSurface p-4 text-description"
          >
            Only the account administrator can manage staff.
          </Text>
        ) : loading ? (
          <ModuleLoadingState
            title="Loading staff access"
            description="Checking staff capacity and available permissions."
          />
        ) : requestError &&
          (!staff.roster.data ||
            !staff.entitlement.data ||
            (staff.gateway.catalog && !staff.catalog.data)) ? (
          <View className="gap-3 rounded-2xl bg-dangerSurface p-4">
            <Text accessibilityRole="alert" className="text-danger">
              {requestError}
            </Text>
            <StaffActionButton
              label="Retry staff information"
              pending={retrying}
              onPress={retry}
            />
          </View>
        ) : unavailable ? (
          <Text>
            This manager is unavailable. Return to staff management and refresh.
          </Text>
        ) : (
          <StaffManagerEditor
            key={manager?.id ?? "new"}
            gateway={staff.gateway}
            manager={manager}
            permissionGroups={staff.catalog.data ?? []}
            pending={staff.create.isPending || staff.update.isPending}
            disabled={Boolean(
              limitReached ||
              staff.roster.isError ||
              staff.catalog.isError ||
              staff.entitlement.isError ||
              staff.entitlement.data?.access_mode === "read_only",
            )}
            error={
              limitReached
                ? "Staff capacity reached or subscription inactive. Review Plan & Billing."
                : staff.roster.error?.message ||
                  staff.catalog.error?.message ||
                  staff.entitlement.error?.message
            }
            onRetry={requestError ? retry : undefined}
            retrying={retrying}
            onCancel={() => router.back()}
            onSubmit={async (payload) => {
              if (manager) {
                await staff.update.mutateAsync({ record: manager, payload });
                router.dismissTo(appRoutes.secondary.staffManagement);
              } else {
                const created = await staff.create.mutateAsync(payload);
                router.replace({
                  pathname: appRoutes.secondary.staffManagerCreated,
                  params: {
                    managerEmail: created.email,
                    managerName: created.name,
                    deliveryStatus: created.deliveryStatus ?? "queued",
                  },
                });
              }
            }}
          />
        )}
      </View>
    </Screen>
  );
}
