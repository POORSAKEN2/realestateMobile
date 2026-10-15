import { Feather } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/colors";
import type { PlanTier } from "../../types/domain/billing";

type PlanCardProps = {
  canUpgrade: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  isPending: boolean;
  disabled: boolean;
  onUpgrade: () => void;
  priceLabel: string;
  tier: PlanTier;
};

export function BillingPlanCard({
  canUpgrade,
  isCurrent,
  isSelected,
  isPending,
  disabled,
  onUpgrade,
  priceLabel,
  tier,
}: PlanCardProps) {
  const blocked = disabled || !canUpgrade || isCurrent || isPending;

  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityLabel={`${tier.label}, ${priceLabel}${isCurrent ? ", current plan" : ""}`}
      accessibilityState={{
        checked: isSelected,
        disabled: blocked,
        busy: isPending,
      }}
      activeOpacity={0.8}
      disabled={blocked}
      onPress={() => {
        if (!blocked && !isSelected) onUpgrade();
      }}
      className={`min-h-12 flex-row items-center gap-3 rounded-2xl border p-4 ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-textPrimary/10 bg-surface"
      } ${blocked && !isPending ? "opacity-60" : ""}`}
    >
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-ralewayBold text-base text-textPrimary">
          {tier.label}
        </Text>
        <Text className="font-ralewaySemiBold text-sm leading-5 text-primaryContent">
          {priceLabel}
        </Text>
        {isPending || isCurrent ? (
          <Text className="font-ralewayMedium text-xs text-description">
            {isPending ? "Checking plan…" : "Current plan"}
          </Text>
        ) : null}
      </View>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {isPending ? (
          <ActivityIndicator color={colors.primaryContent} size="small" />
        ) : (
          <Feather
            name={isSelected ? "check-circle" : "circle"}
            color={colors.primaryContent}
            size={22}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
