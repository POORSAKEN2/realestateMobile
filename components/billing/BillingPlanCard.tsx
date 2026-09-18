import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "../../constants/colors";
import type { PlanTier } from "../../types/domain/billing";
import { getPlanTierFeatures } from "../../utils/billing/planCatalog";
import { BillingActionButton } from "./BillingActionButton";

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

export function BillingPlanCard({
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
        <View className="mt-5">
          <BillingActionButton
            label={isPending ? "Checking plan…" : `Choose ${tier.label}`}
            disabled={disabled}
            isLoading={isPending}
            onPress={onUpgrade}
            primary
          />
        </View>
      ) : null}
    </View>
  );
}
