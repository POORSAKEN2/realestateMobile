import { Feather } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";

import { EntitlementSummary } from "../../components/billing/EntitlementSummary";
import { RevenueCatSubscriptionCard } from "../../components/billing/RevenueCatSubscriptionCard";
import { ServerAccessCard } from "../../components/billing/ServerAccessCard";
import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";
import { LegalLink } from "../../components/legal/LegalLink";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleLoadingState } from "../../components/ui/ModuleState";
import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/buttons/Button";
import { colors } from "../../constants/colors";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { useAuth } from "../../hooks/useAuth";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { hasAppPermission } from "../../utils/auth/accessPolicy";
import { isAuthUser } from "../../utils/profile/profileForm";

export default function BillingScreen() {
  const { session } = useAuth();
  const accountEmail = isAuthUser(session?.user)
    ? session.user.email?.trim()
    : undefined;
  const canManage = hasAppPermission(session?.user, "billing.checkout");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { refresh: refreshStore } = useRevenueCat();
  const {
    data: entitlement,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useBillingEntitlement();
  const viewPlans = useCallback(() => setIsUpgradeModalOpen(true), []);
  const refresh = useCallback(async () => {
    // A store failure must not prevent authoritative server access from refreshing.
    await Promise.allSettled([refetch(), refreshStore()]);
  }, [refetch, refreshStore]);

  return (
    <Screen className="bg-surface">
      <ModuleHeader
        eyebrow="Account"
        leading={
          <SecondaryBackButton
            accessibilityLabel="Back from billing"
            variant="secondary"
          />
        }
        title="Plan & Billing"
        supportingText={
          accountEmail
            ? `Signed in as ${accountEmail}`
            : "View organization access and store purchases."
        }
      />
      <PullToRefreshScrollView
        className="-mx-6 mt-6 flex-1"
        contentContainerClassName="gap-5 px-6 pb-12"
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ModuleLoadingState
            title="Loading your plan"
            description="Checking organization access and limits."
          />
        ) : null}
        {isError || (!isLoading && !entitlement) ? (
          <View className="gap-3 rounded-2xl border border-warning/20 bg-warningSurface p-4">
            <Text
              accessibilityRole="alert"
              className="text-sm leading-5 text-textPrimary"
            >
              {entitlement
                ? "Plan information could not be refreshed. The details below are from the last successful check."
                : "Server access is unavailable. Store purchase status does not confirm app access."}
            </Text>
            <Button
              title="Retry plan refresh"
              variant="secondary"
              isLoading={isFetching}
              onPress={() => {
                void refetch();
              }}
            />
          </View>
        ) : null}
        {entitlement ? (
          <>
            <ServerAccessCard
              entitlement={entitlement}
              canManage={canManage}
              onViewPlans={viewPlans}
            />
            <EntitlementSummary entitlement={entitlement} />
          </>
        ) : null}
        <RevenueCatSubscriptionCard
          canManagePurchases={canManage}
          entitlement={entitlement}
          onViewPlans={viewPlans}
        />
        <View className="flex-row items-start gap-3 rounded-2xl border border-primary/15 bg-panel p-4">
          <Feather name="shield" size={18} color={colors.primary} />
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayBold text-xs text-textPrimary">
              Organization-wide access
            </Text>
            <Text className="mt-1 text-xs leading-5 text-description">
              Plan limits are shared by this organization. Each manager's
              permissions still determine which records and actions they can
              access.
            </Text>
          </View>
        </View>
        <Text className="text-center font-ralewayMedium text-xs leading-5 text-description">
          Store purchases are governed by our{" "}
          <LegalLink
            className="font-ralewayBold text-primary underline"
            document="terms"
          >
            Terms of Service
          </LegalLink>{" "}
          and{" "}
          <LegalLink
            className="font-ralewayBold text-primary underline"
            document="privacy"
          >
            Privacy Policy
          </LegalLink>
          .
        </Text>
      </PullToRefreshScrollView>
      {canManage ? (
        <UpgradePlanModal
          isVisible={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      ) : null}
    </Screen>
  );
}
