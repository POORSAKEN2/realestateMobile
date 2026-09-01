import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
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
import { useBillingEntitlement, useCreateBillingCheckout } from "../../hooks/api/useBillingEntitlement";

type UpgradePlanModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function UpgradePlanModal({ isVisible, onClose }: UpgradePlanModalProps) {
  const { data: entitlement } = useBillingEntitlement();
  const checkoutMutation = useCreateBillingCheckout();

  async function handleUpgrade(tierKey: string) {
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
    }
  }

  const tiers = entitlement?.tiers || [
    { key: "free", label: "Free Tier", property_limit: 2, price_php: 0 },
    { key: "tier_1", label: "Tier 1", property_limit: 5, price_php: 299.99 },
    { key: "all_in", label: "All-In", property_limit: null, price_php: 1499.99 },
  ];

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-primary/10 bg-white px-5 py-4">
          <View className="flex-1">
            <Text className="font-ralewayBold text-xl text-textPrimary">
              Upgrade Subscription
            </Text>
            <Text className="font-ralewayMedium text-xs text-description">
              Unlock higher property limits & portfolio features
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerClassName="pb-10 gap-4"
          showsVerticalScrollIndicator={false}
        >
          {tiers.map((tier) => {
            const isCurrent = entitlement?.tier === tier.key;
            const isAllIn = tier.key === "all_in";

            return (
              <View
                key={tier.key}
                className={`rounded-3xl border p-5 shadow-sm ${
                  isAllIn
                    ? "border-primary bg-primary/5"
                    : isCurrent
                      ? "border-accent bg-accent/10"
                      : "border-primary/15 bg-white"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View>
                    <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                      {tier.label}
                    </Text>
                    <Text className="mt-1 font-ralewayBold text-2xl text-primary">
                      {tier.price_php === 0
                        ? "Free"
                        : `₱${tier.price_php.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                      {tier.price_php > 0 ? (
                        <Text className="font-ralewayMedium text-xs text-description">
                          {" "}
                          / month
                        </Text>
                      ) : null}
                    </Text>
                  </View>

                  {isCurrent ? (
                    <View className="rounded-full bg-primary px-3 py-1">
                      <Text className="font-ralewayBold text-[10px] uppercase text-white">
                        Active Plan
                      </Text>
                    </View>
                  ) : isAllIn ? (
                    <View className="rounded-full bg-accent px-3 py-1">
                      <Text className="font-ralewayBold text-[10px] uppercase text-textPrimary">
                        Best Value
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Features */}
                <View className="my-4 border-t border-primary/10 pt-3 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Feather name="check-circle" size={15} color={colors.primary} />
                    <Text className="font-ralewayMedium text-xs text-textPrimary">
                      {tier.property_limit === null
                        ? "Unlimited managed properties"
                        : `Up to ${tier.property_limit} properties`}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather name="check-circle" size={15} color={colors.primary} />
                    <Text className="font-ralewayMedium text-xs text-textPrimary">
                      Full Floor Plan Canvas & Bedspace management
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather name="check-circle" size={15} color={colors.primary} />
                    <Text className="font-ralewayMedium text-xs text-textPrimary">
                      Financial ledger, rent tracking & analytics
                    </Text>
                  </View>
                </View>

                {/* CTA */}
                {!isCurrent && tier.key !== "free" ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="h-12 items-center justify-center rounded-2xl bg-primary"
                    disabled={checkoutMutation.isPending}
                    onPress={() => handleUpgrade(tier.key)}
                  >
                    <Text className="font-ralewayExtraBold text-sm text-white">
                      Upgrade to {tier.label}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
