import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import {
  useBillingEntitlement,
} from "../../hooks/api/useBillingEntitlement";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import type { PlanTier } from "../../types/domain/billing";
import type { PlanChangePreview, SubscriptionTierKey } from "../../types/domain/billing";
import { fetchPlanChangePreview } from "../../api/billing";
import { useAccess } from "../../hooks/auth/useAccess";
import { blockerMessage } from "../../utils/billing/entitlementPresentation";
import { effectiveSubscriptionTier } from "../../utils/billing/planCapabilities";
import { ModalHeader } from "../ui/ModalHeader";

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

type PlanCardProps = {
  canUpgrade: boolean;
  isCurrent: boolean;
  isFeatured: boolean;
  isPending: boolean;
  disabled: boolean;
  onUpgrade: () => void;
  tier: PlanTier;
};

const fallbackTiers: PlanTier[] = [
  { key: "free", label: "Free Tier", property_limit: 2, price_php: 0 },
  { key: "tier1", label: "Tier 1", property_limit: 5, price_php: 299.99 },
  { key: "all_in", label: "All-In", property_limit: null, price_php: 1499.99 },
];

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
  tier,
}: PlanCardProps) {
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
          <View className="mt-1.5 flex-row items-baseline gap-1">
            <Text className="font-ralewayExtraBold text-2xl text-primary">
              {tier.price_php === 0
                ? "Free"
                : `₱${tier.price_php.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}`}
            </Text>
            {tier.price_php > 0 ? (
              <Text className="font-ralewayMedium text-xs text-description">
                / month
              </Text>
            ) : null}
          </View>
        </View>

        <PlanBadge isCurrent={isCurrent} isFeatured={isFeatured} />
      </View>

      <View className="mt-4 gap-2.5 border-t border-primary/10 pt-4">
        <PlanFeature>
          {tier.property_limit === null
            ? "Unlimited managed properties"
            : `Up to ${tier.property_limit} properties`}
        </PlanFeature>
        <PlanFeature>Floor plans and bedspace management</PlanFeature>
        <PlanFeature>
          Rent tracking, financial ledger, and analytics
        </PlanFeature>
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
  const { data: entitlement, isFetching, isError, refetch } = useBillingEntitlement();
  const { can } = useAccess();
  const { presentPaywallForTier } = useRevenueCat();
  const [pendingTierKey, setPendingTierKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ tier: SubscriptionTierKey; result: PlanChangePreview } | null>(null);
  const busy = useRef(false);
  useEffect(() => { if (!isVisible) setPreview(null); }, [isVisible]);
  const tiers = entitlement?.tiers?.length ? entitlement.tiers : fallbackTiers;
  const currentTierKey = effectiveSubscriptionTier(entitlement);
  async function handleUpgrade(tierKey: string) {
    if (busy.current || !can("billing.checkout") || !entitlement || isFetching || isError) return;
    if (!["free", "tier1", "all_in"].includes(tierKey)) return;
    busy.current = true;
    setPendingTierKey(tierKey);
    try {
      const result = await fetchPlanChangePreview(tierKey as SubscriptionTierKey);
      setPreview({ tier: tierKey as SubscriptionTierKey, result });
    } catch (err) {
      Alert.alert("Plan preview unavailable", err instanceof Error ? err.message : "Please try again.");
    } finally {
      busy.current = false;
      setPendingTierKey(null);
    }
  }

  async function continuePurchase() {
    if (busy.current || !preview?.result.allowed || preview.tier === "free" || !can("billing.checkout")) return;
    busy.current = true;
    setPendingTierKey(preview.tier);
    try {
      // Recheck usage immediately before checkout; the server also enforces it.
      const latest = await fetchPlanChangePreview(preview.tier);
      setPreview({ ...preview, result: latest });
      if (!latest.allowed) return;
      await presentPaywallForTier(preview.tier);
      onClose();
    } catch (err) {
      Alert.alert(
        "Upgrade Plan",
        err instanceof Error
          ? err.message
          : "RevenueCat could not open the requested plan.",
      );
    } finally {
      busy.current = false;
      setPendingTierKey(null);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => { if (!busy.current) onClose(); }}
      presentationStyle="pageSheet"
      visible={isVisible}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        <ModalHeader
          closeAccessibilityLabel="Close upgrade subscription"
          onClose={() => { if (!busy.current) onClose(); }}
          subtitle="Choose the property capacity that fits your portfolio."
          title="Choose subscription"
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-6 pb-10 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {message && <Text accessibilityRole="alert" className="rounded-2xl bg-warningSurface p-4 text-textPrimary">{message}</Text>}
          {requiredTier && <Text className="text-description">Suggested plan: {tiers.find(tier => tier.key === requiredTier)?.label ?? requiredTier}</Text>}
          {isFetching && <Text className="text-description">Refreshing available plans…</Text>}
          {isError && <TouchableOpacity accessibilityRole="button" onPress={() => void refetch()}><Text className="text-danger">Plans could not be loaded. Tap to retry.</Text></TouchableOpacity>}
          {!can("billing.checkout") && <Text className="text-description">Ask your account owner to change the organization plan.</Text>}
          {preview && <View className="gap-3 rounded-2xl bg-white p-4">
            <Text className="font-ralewayBold text-textPrimary">Plan change preview: {tiers.find(tier => tier.key === preview.tier)?.label ?? preview.tier}</Text>
            {preview.result.blockers.map(blocker => <Text key={blocker.dimension} accessibilityRole="alert" className="text-danger">{blockerMessage(blocker)}</Text>)}
            {preview.result.allowed && <Text className="text-description">Your current usage fits this plan.</Text>}
            {preview.result.allowed && preview.tier !== "free" && can("billing.checkout") && <TouchableOpacity accessibilityRole="button" disabled={pendingTierKey !== null} onPress={() => void continuePurchase()} className="rounded-2xl bg-primary p-4">
              <Text className="text-center text-white">{pendingTierKey ? "Opening paywall…" : "Continue in RevenueCat"}</Text>
            </TouchableOpacity>}
          </View>}
          {tiers.map((tier) => {
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
                disabled={!entitlement || isFetching || isError || pendingTierKey !== null}
                key={tier.key}
                onUpgrade={() => handleUpgrade(tier.key)}
                tier={tier}
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
