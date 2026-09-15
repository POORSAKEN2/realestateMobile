import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { CustomerInfo } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import type { RevenueCatProductKey } from "../../constants/revenueCat";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import type { PlanTier } from "../../types/domain/billing";
import type {
  PlanChangePreview,
  SubscriptionTierKey,
} from "../../types/domain/billing";
import { fetchPlanChangePreview } from "../../api/billing";
import { useAccess } from "../../hooks/auth/useAccess";
import { blockerMessage } from "../../utils/billing/entitlementPresentation";
import { getBillingAccountState } from "../../utils/billing/billingAccountState";
import { effectiveSubscriptionTier } from "../../utils/billing/planCapabilities";
import {
  FALLBACK_PLAN_TIERS,
  formatRevenueCatPackagePrice,
  getMissingBillingPeriodLabels,
  getPlanTierFeatures,
  getTierStorePriceLabel,
} from "../../utils/billing/planCatalog";
import {
  getMissingRevenueCatProductKeys,
  getRevenueCatPackagesForTier,
  hasActiveRevenueCatSubscription,
  hasRevenueCatLifetimeAccess,
  hasRevenueCatPurchaseHistory,
} from "../../utils/billing/revenueCatCustomer";
import { getRevenueCatPurchaseSummary } from "../../utils/billing/revenueCatPurchaseSummary";
import { LegalLink } from "../legal/LegalLink";
import { ModalHeader } from "../ui/ModalHeader";
import { RevenueCatPackagePicker } from "./RevenueCatPackagePicker";
import { RevenueCatPurchaseSummaryCard } from "./RevenueCatPurchaseSummaryCard";

const TIER_RANK: Readonly<Record<string, number>> = {
  free: 0,
  tier1: 1,
  all_in: 2,
};

type UpgradePlanModalProps = {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
  requiredTier?: string;
};

type CompletedPurchase = {
  customerInfo: CustomerInfo;
  productKey: RevenueCatProductKey;
};

type PlanCardProps = {
  canUpgrade: boolean;
  isCurrent: boolean;
  isFeatured: boolean;
  isPending: boolean;
  disabled: boolean;
  onUpgrade: () => void;
  priceLabel: string;
  tier: PlanTier;
};

function PlanBadge({
  isCurrent,
  isFeatured,
}: {
  isCurrent: boolean;
  isFeatured: boolean;
}) {
  if (!isCurrent && !isFeatured) return null;

  return (
    <View className="rounded-full bg-accent px-3 py-1.5">
      <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wide text-success">
        {isCurrent ? "Current plan" : "Best value"}
      </Text>
    </View>
  );
}

function PlanFeature({ children }: { children: string }) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Feather
        name="check-circle"
        color={colors.primary}
        size={17}
        style={{ marginTop: 1 }}
      />
      <Text className="min-w-0 flex-1 font-ralewayMedium text-xs leading-5 text-textPrimary">
        {children}
      </Text>
    </View>
  );
}

function PlanCard({
  canUpgrade,
  isCurrent,
  isFeatured,
  isPending,
  disabled,
  onUpgrade,
  priceLabel,
  tier,
}: PlanCardProps) {
  const features = getPlanTierFeatures(tier);

  return (
    <View
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-sm shadow-primary/5 ${
        isCurrent
          ? "border-primary/25 bg-primary/10"
          : isFeatured
            ? "border-primary/25 bg-primary/5"
            : "border-primary/15 bg-white"
      }`}
    >
      {isFeatured ? (
        <View className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-accent/30" />
      ) : null}

      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            className="font-ralewayExtraBold text-lg text-textPrimary"
            numberOfLines={1}
          >
            {tier.label}
          </Text>
          <Text className="mt-1.5 font-ralewayExtraBold text-base text-primary">
            {priceLabel}
          </Text>
        </View>

        <PlanBadge isCurrent={isCurrent} isFeatured={isFeatured} />
      </View>

      <View className="mt-4 gap-2.5 border-t border-primary/10 pt-4">
        {features.map((feature) => (
          <PlanFeature key={feature}>{feature}</PlanFeature>
        ))}
      </View>

      {canUpgrade ? (
        <TouchableOpacity
          accessibilityLabel={`Choose ${tier.label}`}
          accessibilityRole="button"
          accessibilityState={{ busy: isPending, disabled }}
          activeOpacity={0.8}
          className={`mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 ${
            isPending ? "opacity-70" : ""
          }`}
          disabled={disabled}
          onPress={onUpgrade}
        >
          {isPending ? (
            <ActivityIndicator color={colors.whitePrimary} size="small" />
          ) : null}
          <Text className="font-ralewayExtraBold text-sm text-white">
            {isPending ? "Checking plan…" : `Choose ${tier.label}`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function UpgradePlanModal({
  isVisible,
  onClose,
  message,
  requiredTier,
}: UpgradePlanModalProps) {
  const {
    data: entitlement,
    isFetching,
    isError,
    refetch,
  } = useBillingEntitlement();
  const { can } = useAccess();
  const {
    customerInfo,
    isLoading: isRevenueCatLoading,
    isPremium,
    packages,
    presentCustomerCenter,
    purchasePackage,
    refresh: refreshRevenueCat,
    serverSyncStatus,
  } = useRevenueCat();
  const [pendingTierKey, setPendingTierKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    tier: SubscriptionTierKey;
    result: PlanChangePreview;
  } | null>(null);
  const [selectedProductKey, setSelectedProductKey] =
    useState<RevenueCatProductKey | null>(null);
  const [completedPurchase, setCompletedPurchase] =
    useState<CompletedPurchase | null>(null);
  const [isManagingPurchase, setIsManagingPurchase] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    if (!isVisible) {
      setPreview(null);
      setSelectedProductKey(null);
      setCompletedPurchase(null);
    }
  }, [isVisible]);
  const tiers = entitlement?.tiers?.length
    ? entitlement.tiers
    : FALLBACK_PLAN_TIERS;
  const currentTierKey = effectiveSubscriptionTier(entitlement);
  const hasPurchaseHistory = hasRevenueCatPurchaseHistory(customerInfo);
  const hasActiveSubscription = hasActiveRevenueCatSubscription(customerInfo);
  const hasLifetimeAccess = hasRevenueCatLifetimeAccess(customerInfo);
  const selectedPaidTier =
    preview?.result.allowed &&
    (preview.tier === "tier1" || preview.tier === "all_in")
      ? preview.tier
      : null;
  const packageOptions = useMemo(
    () =>
      selectedPaidTier
        ? getRevenueCatPackagesForTier(packages, selectedPaidTier, {
            includeLifetime: !hasPurchaseHistory,
          })
        : [],
    [hasPurchaseHistory, packages, selectedPaidTier],
  );
  const missingPeriodLabels = useMemo(
    () =>
      selectedPaidTier
        ? getMissingBillingPeriodLabels(
            getMissingRevenueCatProductKeys(packages, selectedPaidTier, {
              includeLifetime: !hasPurchaseHistory,
            }),
          )
        : [],
    [hasPurchaseHistory, packages, selectedPaidTier],
  );
  const selectedOption = packageOptions.find(
    (option) => option.key === selectedProductKey,
  );
  const selectedPackage = selectedOption?.pkg;
  const completedCustomerInfo = completedPurchase
    ? (customerInfo ?? completedPurchase.customerInfo)
    : null;
  const completedSummary = useMemo(
    () =>
      completedPurchase && completedCustomerInfo
        ? getRevenueCatPurchaseSummary(
            completedCustomerInfo,
            completedPurchase.productKey,
          )
        : null,
    [completedCustomerInfo, completedPurchase],
  );
  const completedBillingState = useMemo(
    () =>
      completedCustomerInfo
        ? getBillingAccountState(entitlement, completedCustomerInfo)
        : null,
    [completedCustomerInfo, entitlement],
  );

  useEffect(() => {
    setSelectedProductKey((currentKey) =>
      currentKey && packageOptions.some((option) => option.key === currentKey)
        ? currentKey
        : (packageOptions[0]?.key ?? null),
    );
  }, [packageOptions]);

  async function handleUpgrade(tierKey: string) {
    if (
      busy.current ||
      !can("billing.checkout") ||
      !entitlement ||
      isFetching ||
      isError
    )
      return;
    if (!["free", "tier1", "all_in"].includes(tierKey)) return;
    busy.current = true;
    setPendingTierKey(tierKey);
    try {
      const result = await fetchPlanChangePreview(
        tierKey as SubscriptionTierKey,
      );
      setPreview({ tier: tierKey as SubscriptionTierKey, result });
    } catch (err) {
      Alert.alert(
        "Plan preview unavailable",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      busy.current = false;
      setPendingTierKey(null);
    }
  }

  async function continuePurchase() {
    if (
      busy.current ||
      !preview?.result.allowed ||
      preview.tier === "free" ||
      !selectedPackage ||
      !can("billing.checkout")
    )
      return;
    busy.current = true;
    setPendingTierKey(preview.tier);
    try {
      // Recheck usage immediately before checkout; the server also enforces it.
      const latest = await fetchPlanChangePreview(preview.tier);
      setPreview({ ...preview, result: latest });
      if (!latest.allowed) return;
      const purchased = await purchasePackage(selectedPackage);
      if (!purchased) return;
      const summary = getRevenueCatPurchaseSummary(
        purchased,
        selectedOption.key,
      );
      if (!summary) {
        Alert.alert(
          "Purchase complete",
          "Your transaction succeeded and organization access is activating automatically.",
        );
        onClose();
        return;
      }
      setCompletedPurchase({
        customerInfo: purchased,
        productKey: summary.productKey,
      });
      setPreview(null);
      setSelectedProductKey(null);
    } catch (err) {
      Alert.alert(
        "Upgrade Plan",
        err instanceof Error ? err.message : "Purchase could not be completed.",
      );
    } finally {
      busy.current = false;
      setPendingTierKey(null);
    }
  }

  async function reloadPurchaseOptions() {
    try {
      await refreshRevenueCat();
    } catch (err) {
      Alert.alert(
        "Purchase options unavailable",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  async function managePurchase() {
    if (busy.current) return;
    busy.current = true;
    setIsManagingPurchase(true);
    try {
      await presentCustomerCenter();
      await refetch();
    } catch (err) {
      Alert.alert(
        "Subscription unavailable",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      busy.current = false;
      setIsManagingPurchase(false);
    }
  }

  return (
    <Modal
      allowSwipeDismissal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={isVisible}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        <ModalHeader
          closeAccessibilityLabel="Close upgrade subscription"
          onClose={onClose}
          subtitle={
            completedPurchase
              ? "Your transaction was successful."
              : "Choose the property capacity that fits your portfolio."
          }
          title={
            completedPurchase ? "Purchase complete" : "Choose subscription"
          }
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-6 pb-10 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {completedPurchase && completedSummary && completedBillingState ? (
            <RevenueCatPurchaseSummaryCard
              isManaging={isManagingPurchase}
              onDone={onClose}
              onManage={() => void managePurchase()}
              serverSyncStatus={serverSyncStatus}
              summary={completedSummary}
              syncRequired={completedBillingState.syncRequired}
            />
          ) : (
            <>
              {message && (
                <Text
                  accessibilityRole="alert"
                  className="rounded-2xl bg-warningSurface p-4 text-textPrimary"
                >
                  {message}
                </Text>
              )}
              {requiredTier && (
                <Text className="text-description">
                  Suggested plan:{" "}
                  {tiers.find((tier) => tier.key === requiredTier)?.label ??
                    requiredTier}
                </Text>
              )}
              {isFetching && (
                <Text className="text-description">
                  Refreshing available plans…
                </Text>
              )}
              {isError && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => void refetch()}
                >
                  <Text className="text-danger">
                    Plans could not be loaded. Tap to retry.
                  </Text>
                </TouchableOpacity>
              )}
              {!can("billing.checkout") && (
                <Text className="text-description">
                  Ask your account owner to change the organization plan.
                </Text>
              )}
              {isPremium && can("billing.checkout") ? (
                <View className="gap-3 rounded-2xl bg-white p-4">
                  <Text className="font-ralewayBold text-textPrimary">
                    {hasLifetimeAccess
                      ? "Lifetime access is active"
                      : "Manage your active subscription"}
                  </Text>
                  <Text className="text-description">
                    {hasLifetimeAccess
                      ? "This organization owns permanent access. No additional plan purchase is needed."
                      : "Use RevenueCat Customer Center to change billing periods, switch tiers, cancel, or get billing support."}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    className="rounded-2xl bg-primary p-4"
                    onPress={() => void managePurchase()}
                  >
                    <Text className="text-center font-ralewayBold text-white">
                      {hasActiveSubscription
                        ? "Open subscription management"
                        : "Open purchase support"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {!isPremium && preview && (
                <View className="gap-3 rounded-2xl bg-white p-4">
                  <Text className="font-ralewayBold text-textPrimary">
                    Plan change preview:{" "}
                    {tiers.find((tier) => tier.key === preview.tier)?.label ??
                      preview.tier}
                  </Text>
                  {preview.result.blockers.map((blocker) => (
                    <Text
                      key={blocker.dimension}
                      accessibilityRole="alert"
                      className="text-danger"
                    >
                      {blockerMessage(blocker)}
                    </Text>
                  ))}
                  {preview.result.allowed && (
                    <Text className="text-description">
                      Your current usage fits this plan.
                    </Text>
                  )}
                  {selectedPaidTier && (
                    <RevenueCatPackagePicker
                      disabled={pendingTierKey !== null}
                      isLoading={isRevenueCatLoading}
                      missingPeriodLabels={missingPeriodLabels}
                      onSelect={setSelectedProductKey}
                      onRetry={() => void reloadPurchaseOptions()}
                      options={packageOptions}
                      selectedKey={selectedProductKey}
                    />
                  )}
                  {selectedPaidTier &&
                    can("billing.checkout") &&
                    selectedOption && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={pendingTierKey !== null}
                        onPress={() => void continuePurchase()}
                        className="rounded-2xl bg-primary p-4"
                      >
                        <Text className="text-center font-ralewayBold text-white">
                          {pendingTierKey
                            ? "Processing purchase…"
                            : `Purchase ${formatRevenueCatPackagePrice(selectedOption.key, selectedOption.pkg)}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              )}
              {!isPremium &&
                tiers.map((tier) => {
                  const isCurrent = currentTierKey === tier.key;
                  const isFeatured = tier.key === "all_in";
                  const normalizedTier = tier.key as SubscriptionTierKey;
                  const candidateRank = TIER_RANK[normalizedTier];
                  const canUpgrade =
                    can("billing.checkout") &&
                    typeof candidateRank === "number" &&
                    candidateRank > TIER_RANK[currentTierKey];

                  return (
                    <PlanCard
                      canUpgrade={canUpgrade}
                      isCurrent={isCurrent}
                      isFeatured={isFeatured}
                      isPending={pendingTierKey === tier.key}
                      disabled={
                        !entitlement ||
                        isFetching ||
                        isError ||
                        pendingTierKey !== null
                      }
                      key={tier.key}
                      onUpgrade={() => handleUpgrade(tier.key)}
                      priceLabel={getTierStorePriceLabel(packages, tier)}
                      tier={tier}
                    />
                  );
                })}

              <View className="gap-2 rounded-2xl border border-primary/15 bg-white p-4">
                <Text className="font-ralewayBold text-xs text-textPrimary">
                  Purchase terms
                </Text>
                <Text className="font-ralewayMedium text-xs leading-5 text-description">
                  Monthly and yearly purchases renew automatically until
                  canceled. Charges use the price shown by the App Store or
                  Google Play and grant organization-wide access. Manage or
                  cancel through Customer Center. Lifetime purchases are
                  one-time purchases for eligible new customers.
                </Text>
                <Text className="font-ralewayMedium text-xs text-description">
                  <LegalLink
                    className="font-ralewayBold text-primary underline"
                    document="terms"
                  >
                    Terms of Service
                  </LegalLink>{" "}
                  ·{" "}
                  <LegalLink
                    className="font-ralewayBold text-primary underline"
                    document="privacy"
                  >
                    Privacy Policy
                  </LegalLink>
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
