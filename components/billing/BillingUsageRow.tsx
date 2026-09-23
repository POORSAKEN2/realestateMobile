import { Text, View } from "react-native";
import type { UsageLimit } from "../../types/domain/billing";
import {
  dimensionLabels,
  formatUsage,
  usagePercentage,
} from "../../utils/billing/entitlementPresentation";

export function BillingUsageRow({
  dimension,
  usage,
}: {
  dimension: string;
  usage: UsageLimit;
}) {
  const label = dimensionLabels[dimension] ?? dimension;
  const percentage = usagePercentage(usage);
  const atLimit = usage.limit !== null && usage.used >= usage.limit;
  const description = `${formatUsage(dimension, usage.used)} / ${usage.limit === null ? "Unlimited" : formatUsage(dimension, usage.limit)}`;
  return (
    <View className="gap-2" accessibilityLabel={`${label}: ${description}`}>
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 font-ralewaySemiBold text-sm text-description">
          {label}
        </Text>
        <Text className="max-w-[65%] text-right font-ralewayBold text-sm text-textPrimary">
          {description}
        </Text>
      </View>
      {usage.limit !== null ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={`${label} usage`}
          accessibilityValue={{ min: 0, max: 100, now: percentage }}
          className="h-2 overflow-hidden rounded-full bg-primary/10"
        >
          <View
            className={`h-full rounded-full ${atLimit ? "bg-danger" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </View>
      ) : null}
    </View>
  );
}
