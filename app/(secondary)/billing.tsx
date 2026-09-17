import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";
import { EntitlementSummary } from "../../components/billing/EntitlementSummary";
import { RevenueCatSubscriptionCard } from "../../components/billing/RevenueCatSubscriptionCard";
import { LegalLink } from "../../components/legal/LegalLink";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { useAuth } from "../../hooks/useAuth";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { hasAppPermission } from "../../utils/auth/accessPolicy";
import {
  FALLBACK_PLAN_TIERS,
  getPlanTierFeatures,
  getTierStorePriceLabel,
} from "../../utils/billing/planCatalog";
import { isAuthUser } from "../../utils/profile/profileForm";

export default function BillingScreen() {
  const { session } = useAuth();
  const accountEmail = isAuthUser(session?.user)
    ? session.user.email?.trim()
    : undefined;
  const canStartCheckout = hasAppPermission(session?.user, "billing.checkout");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { isPremium, packages, presentCustomerCenter } = useRevenueCat();
  const {
    data: entitlement,
    isLoading,
    isError,
    refetch,
  } = useBillingEntitlement();

  const propertyCount = entitlement?.property_count ?? 0;
  const propertyLimit = entitlement?.property_limit;
  const isUnlimited = propertyLimit === null;
  const usagePercentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((propertyCount / (propertyLimit || 1)) * 100));
  const tiers = entitlement?.tiers?.length
    ? entitlement.tiers
    : FALLBACK_PLAN_TIERS;

  async function openBillingAction() {
    if (!isPremium) {
      setIsUpgradeModalOpen(true);
      return;
    }

    try {
      await presentCustomerCenter();
      await refetch();
    } catch (cause) {
      Alert.alert(
        "Subscription unavailable",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Account"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from billing"
              variant="secondary"
            />
          }
          title="Plan & Billing"
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError || !entitlement ? (
          <View className="mt-6 gap-5">
            <TouchableOpacity
              accessibilityRole="button"
              className="p-5"
              onPress={() => void refetch()}
            >
              <Text className="text-danger">
                Plan information is unavailable. Tap to retry.
              </Text>
            </TouchableOpacity>
            <RevenueCatSubscriptionCard
              accountEmail={accountEmail}
              canManagePurchases={canStartCheckout}
              entitlement={entitlement}
              onViewPlans={() => setIsUpgradeModalOpen(true)}
            />
          </View>
        ) : (
          <PullToRefreshScrollView
            className="-mx-6 mt-6 flex-1"
            contentContainerClassName="px-6 pb-12 gap-5"
            onRefresh={refetch}
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-12">
              {/* Active Plan Card */}
              <View className="mt-3 rounded-[28px] border border-primary/20 bg-primary/10 p-5 shadow-sm shadow-primary/5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
                      <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                        {entitlement?.tier_label || "Unavailable"}
                      </Text>
                      <Text className="font-ralewayBold text-xs text-primary">
                        Current access
                        {entitlement.access_mode === "read_only"
                          ? " · Read only"
                          : entitlement.entitlement_source === "trial"
                            ? " · Trial"
                            : entitlement.entitlement_source === "legacy"
                              ? " · Grandfathered"
                              : ""}
                      </Text>
                    </View>
                  </View>

                  {canStartCheckout ? (
                    <TouchableOpacity
                      accessibilityLabel="Upgrade organization plan"
                      accessibilityRole="button"
                      activeOpacity={0.8}
                      className="rounded-2xl bg-primary px-4 py-2.5"
                      onPress={() => void openBillingAction()}
                    >
                      <Text className="font-ralewayBold text-xs text-white">
                        {isPremium ? "Manage billing" : "Change plan"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row items-center rounded-2xl bg-white/70 px-3 py-2.5">
                      <Ionicons
                        name="lock-closed-outline"
                        color={colors.description}
                        size={14}
                      />
                      <Text className="ml-1.5 font-ralewayBold text-[10px] uppercase text-description">
                        Admin managed
                      </Text>
                    </View>
                  )}
                </View>

                {/* Property Quota Progress */}
                <View className="mt-6 border-t border-primary/15 pt-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                      Property Limit Quota
                    </Text>
                    <Text className="font-ralewayBold text-sm text-textPrimary">
                      {propertyCount}{" "}
                      {isUnlimited
                        ? "Properties (Unlimited)"
                        : `/ ${propertyLimit} Properties`}
                    </Text>
                  </View>

                  {!isUnlimited ? (
                    <View className="mt-2 h-3 w-full overflow-hidden rounded-full bg-primary/20">
                      <View
                        className={`h-full rounded-full ${
                          usagePercentage >= 100 ? "bg-danger" : "bg-primary"
                        }`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </View>
                  ) : null}

                  {!isUnlimited && propertyCount >= (propertyLimit || 0) ? (
                    <Text className="mt-2 font-ralewayMedium text-xs text-danger">
                      You have reached your plan's property limit. Upgrade to
                      add more properties.
                    </Text>
                  ) : null}
                </View>
              </View>

              <EntitlementSummary entitlement={entitlement} />
              <RevenueCatSubscriptionCard
                accountEmail={accountEmail}
                canManagePurchases={canStartCheckout}
                entitlement={entitlement}
                onViewPlans={() => setIsUpgradeModalOpen(true)}
              />
              {/* Plan Catalog Grid */}
              {/* <View className="gap-3">
                <Text className="font-ralewayBold text-base text-textPrimary">
                  Available Subscription Tiers
                </Text>

                {tiers.map((tier) => {
                  const isCurrent = entitlement?.tier === tier.key && entitlement?.entitlement_source !== "trial";
                  const features = getPlanTierFeatures(tier);

                  return (
                    <View
                      key={tier.key}
                      className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="min-w-0 flex-1 pr-3">
                          <Text className="font-ralewayBold text-base text-textPrimary">
                            {tier.label}
                          </Text>
                          <Text className="mt-0.5 text-xs text-description">
                            {features.slice(0, 2).join(" · ")}
                          </Text>
                        </View>

                        <View className="max-w-[42%] items-end">
                          <Text
                            className="text-right font-ralewayExtraBold text-sm text-primary"
                            numberOfLines={2}
                          >
                            {getTierStorePriceLabel(packages, tier)}
                          </Text>
                          {isCurrent ? (
                            <Text className="font-ralewayBold text-[10px] uppercase text-success">
                              Current Tier
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View> */}
            </View>

            {/* Billing Engine Notice */}
            <View className="flex-row items-start gap-3 rounded-2xl border border-primary/15 bg-white p-4">
              <Feather name="shield" size={18} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-ralewayBold text-xs text-textPrimary">
                  Organization-Wide Entitlements
                </Text>
                <Text className="mt-1 font-ralewayMedium text-xs leading-4 text-description">
                  Subscription plans are tied to your organization tenant
                  account, automatically granting quota to all linked property
                  managers.
                </Text>
              </View>
            </View>

            <Text className="text-center font-ralewayMedium text-xs text-description">
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
        )}
      </View>

      {canStartCheckout ? (
        <UpgradePlanModal
          isVisible={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      ) : null}
    </Screen>
  );
}
