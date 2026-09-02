import { Ionicons } from "@expo/vector-icons";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { StaffEmptyState } from "../../components/staff/StaffEmptyState";
import { StaffManagerCard } from "../../components/staff/StaffManagerCard";
import { StaffOverviewSummary } from "../../components/staff/StaffOverviewSummary";
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from "../../components/ui/ModuleState";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { useStaffOverview } from "../../hooks/api/useStaffOverview";
import { useAuth } from "../../hooks/useAuth";
import { canManageStaff } from "../../utils/auth/staffAccess";

export default function StaffManagementScreen() {
  const { session } = useAuth();
  const hasStaffAccess = canManageStaff(session?.user);
  const overviewQuery = useStaffOverview(session?.accessToken, hasStaffAccess);
  const overview = overviewQuery.data;

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Account"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from staff management"
              variant="secondary"
            />
          }
          title="Team & Access"
        />

        {!hasStaffAccess ? (
          <View className="mt-8">
            <ModuleEmptyState
              description="Only account owners can view and manage property managers."
              icon="lock-closed-outline"
              title="Owner access required"
            />
          </View>
        ) : overviewQuery.isLoading ? (
          <View className="mt-8 flex-1">
            <ModuleLoadingState
              description="Loading your property manager team"
              title="Staff management"
            />
          </View>
        ) : overviewQuery.isError ? (
          <View className="mt-8 items-center rounded-[28px] border border-danger/20 bg-dangerSurface p-7">
            <Ionicons
              name="cloud-offline-outline"
              color={colors.danger}
              size={36}
            />
            <Text className="mt-3 font-ralewayExtraBold text-lg text-textPrimary">
              Team unavailable
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-description">
              Staff details could not be loaded. Check your connection and try
              again.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.82}
              className="mt-5 min-h-12 items-center justify-center rounded-2xl bg-primary px-6"
              onPress={() => void overviewQuery.refetch()}
            >
              <Text className="font-ralewayExtraBold text-sm text-white">
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : overview ? (
          <ScrollView
            className="-mx-6 mt-6 flex-1"
            contentContainerClassName="gap-4 px-6 pb-10"
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                onRefresh={() => void overviewQuery.refetch()}
                refreshing={overviewQuery.isRefetching}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            <StaffOverviewSummary
              managerCount={overview.managerCount}
              managerLimit={overview.managerLimit}
            />

            {overview.managers.length > 0 ? (
              <View className="gap-3">
                <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                  Your team
                </Text>
                {overview.managers.map((manager) => (
                  <StaffManagerCard key={manager.id} manager={manager} />
                ))}
              </View>
            ) : (
              <StaffEmptyState />
            )}

            <TouchableOpacity
              accessibilityLabel={
                overview.canInvite ? "Invite manager" : "Manager limit reached"
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              activeOpacity={0.82}
              className={`min-h-14 flex-row items-center justify-center rounded-2xl ${
                overview.canInvite ? "bg-primary/60" : "bg-textPrimary/10"
              }`}
              disabled
            >
              <Ionicons
                color={
                  overview.canInvite ? colors.whitePrimary : colors.description
                }
                name={
                  overview.canInvite
                    ? "person-add-outline"
                    : "lock-closed-outline"
                }
                size={20}
              />
              <Text
                className={`ml-2 font-ralewayExtraBold text-base ${
                  overview.canInvite ? "text-white" : "text-description"
                }`}
              >
                {overview.canInvite
                  ? "Invite manager"
                  : "Manager limit reached"}
              </Text>
            </TouchableOpacity>

            <View className="flex-row rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <Ionicons
                name="information-circle-outline"
                color={colors.primary}
                size={20}
              />
              <Text className="ml-3 flex-1 text-sm leading-6 text-description">
                Managers only see assigned properties and permitted actions.
              </Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}
