import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { CustomerInfo } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RevenueCatProductKey } from "../../constants/revenueCat";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { useRevenueCat } from "../../hooks/useRevenueCat";
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
import { BillingPlanCard } from "./BillingPlanCard";
import { BillingActionButton } from "./BillingActionButton";
import { RevenueCatPackagePicker } from "./RevenueCatPackagePicker";
import { RevenueCatPurchaseSummaryCard } from "./RevenueCatPurchaseSummaryCard";

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
  } = useBillingEntitlement({ enabled: isVisible });
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
    ["starter", "professional", "portfolio"].includes(preview.tier)
      ? (preview.tier as "starter" | "professional" | "portfolio")
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
    if (!["starter", "professional", "portfolio"].includes(tierKey)) return;
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
          "Store purchase complete. Server access is being checked.",
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

  const actionPending = pendingTierKey !== null || isManagingPurchase;
  const handleClose = () => {
    if (!actionPending && !busy.current) onClose();
  };
  return (
    <Modal
      allowSwipeDismissal={!actionPending}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="pageSheet"
      visible={isVisible}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        <ModalHeader
          closeAccessibilityLabel="Close upgrade subscription"
          onClose={handleClose}
          disabled={actionPending}
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
                      ? "This organization owns grandfathered lifetime access. Review any new plan limits before changing plans."
                      : "Use RevenueCat Customer Center to change billing periods, switch tiers, cancel, or get billing support."}
                  </Text>
                  <BillingActionButton
                    label={
                      hasActiveSubscription
                        ? "Open subscription management"
                        : "Open purchase support"
                    }
                    disabled={pendingTierKey !== null}
                    isLoading={isManagingPurchase}
                    onPress={() => void managePurchase()}
                    primary
                  />
                </View>
              ) : null}
              {preview && (
                <View className="gap-3 rounded-2xl bg-white p-4">
                  <Text className="font-ralewayBold text-textPrimary">
                    Plan change preview:{" "}
                    {tiers.find((tier) => tier.key === preview.tier)?.label ??
                      preview.tier}
                  </Text>
                  {entitlement?.entitlement_source === "legacy" && (
                    <Text className="text-description">
                      A new purchase uses this plan's quotas. Your grandfathered
                      ownership remains preserved.
                    </Text>
                  )}
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
                      disabled={pendingTierKey !== null || isManagingPurchase}
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
                      <BillingActionButton
                        label={
                          pendingTierKey
                            ? "Processing purchase…"
                            : `Purchase ${formatRevenueCatPackagePrice(selectedOption.key, selectedOption.pkg)}`
                        }
                        isLoading={pendingTierKey !== null}
                        disabled={isManagingPurchase || isRevenueCatLoading}
                        onPress={() => void continuePurchase()}
                        primary
                      />
                    )}
                </View>
              )}
              {tiers.map((tier) => {
                const isCurrent =
                  currentTierKey === tier.key &&
                  entitlement?.entitlement_source !== "trial" &&
                  entitlement?.access_mode !== "read_only";
                const isFeatured = tier.key === "professional";
                const canUpgrade =
                  can("billing.checkout") &&
                  ["starter", "professional", "portfolio"].includes(tier.key) &&
                  (!isCurrent ||
                    entitlement?.entitlement_source === "trial" ||
                    entitlement?.access_mode === "read_only");

                return (
                  <BillingPlanCard
                    canUpgrade={canUpgrade}
                    isCurrent={isCurrent}
                    isFeatured={isFeatured}
                    isPending={pendingTierKey === tier.key}
                    disabled={
                      !entitlement ||
                      isFetching ||
                      isError ||
                      pendingTierKey !== null ||
                      isManagingPurchase
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
                  cancel through Customer Center. Existing lifetime ownership is
                  preserved; new lifetime purchases are unavailable.
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
