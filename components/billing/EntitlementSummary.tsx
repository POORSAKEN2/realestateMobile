import { Text, View } from "react-native";
import type { BillingEntitlement } from "../../types/domain/billing";
import { billingStatusMessage, dimensionLabels, formatUsage } from "../../utils/billing/entitlementPresentation";

export function EntitlementSummary({ entitlement }: { entitlement: BillingEntitlement }) {
  const limits = entitlement.limits;
  return <View className="gap-3 rounded-2xl bg-white p-5">
    <Text accessibilityRole="alert" className="text-textPrimary">{billingStatusMessage(entitlement)}</Text>
    {entitlement.subscribed_tier && entitlement.effective_tier !== entitlement.subscribed_tier &&
      <Text className="text-description">Subscribed: {entitlement.tiers.find(tier => tier.key === entitlement.subscribed_tier)?.label ?? entitlement.subscribed_tier}. Current access: {entitlement.tier_label}.</Text>}
    {entitlement.gating_enabled === false && <Text className="text-description">Plan quota enforcement is currently disabled.</Text>}
    {limits && <>
      {(["published_listings", "storage_bytes", "users"] as const).map(dimension => {
        const usage = limits[dimension];
        if (!usage) return null;
        return <View key={dimension} className="flex-row justify-between gap-3">
          <Text className="text-description">{dimensionLabels[dimension]}</Text>
          <Text className="text-textPrimary">{formatUsage(dimension, usage.used)} / {usage.limit === null ? "Unlimited" : formatUsage(dimension, usage.limit)}</Text>
        </View>;
      })}
      {(["analytics_depth", "support_level", "reports_level"] as const).map(dimension => limits[dimension]?.level &&
        <Text key={dimension} className="text-description">{dimensionLabels[dimension]}: {limits[dimension]!.level.replaceAll("_", " ")}</Text>)}
      {limits.retention_days && <Text className="text-description">History: {limits.retention_days.days === null ? "Unlimited" : `${limits.retention_days.days} days`}</Text>}
    </>}
    {!!entitlement.over_limit_dimensions?.length && <Text accessibilityRole="alert" className="text-danger">Over plan limits: {entitlement.over_limit_dimensions.map(key => dimensionLabels[key] ?? key).join(", ")}. Reduce usage or choose a larger plan.</Text>}
  </View>;
}
