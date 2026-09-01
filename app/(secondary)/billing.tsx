import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { UpgradePlanModal } from "../../components/billing/UpgradePlanModal";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";

export default function BillingScreen() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { data: entitlement, isLoading, isRefetching, refetch } = useBillingEntitlement();

  const propertyCount = entitlement?.property_count ?? 0;
  const propertyLimit = entitlement?.property_limit;
  const isUnlimited = propertyLimit === null || propertyLimit === undefined;
  const usagePercentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((propertyCount / (propertyLimit || 1)) * 100));

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Organization"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from billing"
              variant="secondary"
            />
          }
          title="Plan & Billing"
        />
        <Text className="mt-2 text-base leading-6 text-description">
          Review your subscription tier, property limits, and entitlement quota.
        </Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            className="-mx-6 flex-1 mt-6"
            contentContainerClassName="px-6 pb-12 gap-5"
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                refreshing={isRefetching}
                tintColor={colors.primary}
                onRefresh={refetch}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {/* Active Plan Card */}
            <View className="rounded-[28px] border border-primary/20 bg-primary/10 p-5 shadow-sm shadow-primary/5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
                    <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                      {entitlement?.tier_label || "Free Tier"}
                    </Text>
                    <Text className="font-ralewayBold text-xs text-primary">
                      Active Plan
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="rounded-2xl bg-primary px-4 py-2.5"
                  onPress={() => setIsUpgradeModalOpen(true)}
                >
                  <Text className="font-ralewayBold text-xs text-white">
                    Upgrade
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Property Quota Progress */}
              <View className="mt-6 border-t border-primary/15 pt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-ralewayBold text-xs uppercase tracking-wider text-description">
                    Property Limit Quota
                  </Text>
                  <Text className="font-ralewayBold text-sm text-textPrimary">
                    {propertyCount} {isUnlimited ? "Properties (Unlimited)" : `/ ${propertyLimit} Properties`}
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
                    You have reached your plan's property limit. Upgrade to add more properties.
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Plan Catalog Grid */}
            <View className="gap-3">
              <Text className="font-ralewayBold text-base text-textPrimary">
                Available Subscription Tiers
              </Text>

              {(entitlement?.tiers || [
                { key: "free", label: "Free Tier", property_limit: 2, price_php: 0 },
                { key: "tier_1", label: "Tier 1", property_limit: 5, price_php: 299.99 },
                { key: "all_in", label: "All-In", property_limit: null, price_php: 1499.99 },
              ]).map((tier) => {
                const isCurrent = entitlement?.tier === tier.key;

                return (
                  <View
                    key={tier.key}
                    className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-ralewayBold text-base text-textPrimary">
                          {tier.label}
                        </Text>
                        <Text className="mt-0.5 text-xs text-description">
                          {tier.property_limit === null
                            ? "Unlimited properties"
                            : `Up to ${tier.property_limit} properties`}
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="font-ralewayExtraBold text-base text-primary">
                          {tier.price_php === 0
                            ? "Free"
                            : `₱${tier.price_php.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
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
            </View>

            {/* Billing Engine Notice */}
            <View className="flex-row items-start gap-3 rounded-2xl border border-primary/15 bg-white p-4">
              <Feather name="shield" size={18} color={colors.primary} />
              <View className="flex-1">
                <Text className="font-ralewayBold text-xs text-textPrimary">
                  Organization-Wide Entitlements
                </Text>
                <Text className="mt-1 font-ralewayMedium text-xs leading-4 text-description">
                  Subscription plans are tied to your organization tenant account, automatically granting quota to all linked property managers.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <UpgradePlanModal
        isVisible={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </Screen>
  );
}
