import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  useCreateBillingCheckout,
} from "../../hooks/api/useBillingEntitlement";
import type { PlanTier } from "../../types/domain/billing";
import { ModalHeader } from "../ui/ModalHeader";

type UpgradePlanModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

type PlanCardProps = {
  canUpgrade: boolean;
  isCurrent: boolean;
  isFeatured: boolean;
  isPending: boolean;
  onUpgrade: () => void;
  tier: PlanTier;
};

const fallbackTiers: PlanTier[] = [
  { key: "free", label: "Free Tier", property_limit: 2, price_php: 0 },
  { key: "tier_1", label: "Tier 1", property_limit: 5, price_php: 299.99 },
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
          accessibilityLabel={`Upgrade to ${tier.label}`}
          accessibilityRole="button"
          accessibilityState={{ busy: isPending, disabled: isPending }}
          activeOpacity={0.8}
          className={`mt-5 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 ${
            isPending ? "opacity-70" : ""
          }`}
          disabled={isPending}
          onPress={onUpgrade}
        >
          {isPending ? (
            <ActivityIndicator color={colors.whitePrimary} size="small" />
          ) : null}
          <Text className="font-ralewayExtraBold text-sm text-white">
            {isPending ? "Opening checkout…" : `Upgrade to ${tier.label}`}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function UpgradePlanModal({
  isVisible,
  onClose,
}: UpgradePlanModalProps) {
  const { data: entitlement } = useBillingEntitlement();
  const checkoutMutation = useCreateBillingCheckout();
  const [pendingTierKey, setPendingTierKey] = useState<string | null>(null);
  const tiers = entitlement?.tiers?.length ? entitlement.tiers : fallbackTiers;
  const currentTierKey = entitlement?.tier ?? "free";
  const currentTier = tiers.find((tier) => tier.key === currentTierKey);
  const currentPrice = entitlement?.price_php ?? currentTier?.price_php ?? 0;

  async function handleUpgrade(tierKey: string) {
    setPendingTierKey(tierKey);

    try {
      const response = await checkoutMutation.mutateAsync({ tier: tierKey });
      if (response.checkout_url) {
        await Linking.openURL(response.checkout_url);
        onClose();
      } else {
        Alert.alert(
          "Upgrade Plan",
          "Please visit your Terrane web dashboard to complete subscription payment via Stripe.",
        );
      }
    } catch (err) {
      Alert.alert(
        "Upgrade Plan",
        err instanceof Error
          ? err.message
          : "Billing checkout is currently configured via web portal.",
      );
    } finally {
      setPendingTierKey(null);
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={isVisible}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        <ModalHeader
          closeAccessibilityLabel="Close upgrade subscription"
          onClose={onClose}
          subtitle="Choose the property capacity that fits your portfolio."
          title="Upgrade Subscription"
        />

        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-6 pb-10 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {tiers.map((tier) => {
            const isCurrent = currentTierKey === tier.key;
            const isFeatured = tier.key === "all_in";
            const canUpgrade = !isCurrent && tier.price_php > currentPrice;

            return (
              <PlanCard
                canUpgrade={canUpgrade}
                isCurrent={isCurrent}
                isFeatured={isFeatured}
                isPending={pendingTierKey === tier.key}
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
