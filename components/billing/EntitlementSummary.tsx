import { Text, View } from "react-native";
import type { BillingEntitlement } from "../../types/domain/billing";
import { dimensionLabels } from "../../utils/billing/entitlementPresentation";
import {
  retentionDescription,
  supportLevelLabel,
} from "../../utils/billing/entitlementCapabilities";
import { BillingSummaryRow } from "./BillingSummaryRow";
import { BillingUsageRow } from "./BillingUsageRow";

const quotaDimensions = [
  "published_listings",
  "storage_bytes",
  "users",
] as const;
const featureDimensions = [
  "analytics_depth",
  "support_level",
  "reports_level",
] as const;

export function EntitlementSummary({
  entitlement,
}: {
  entitlement: BillingEntitlement;
}) {
  const limits = entitlement.limits;
  const subscribedTier = entitlement.subscribed_tier;
  return (
    <View className="gap-4 rounded-[28px] border border-textPrimary/10 bg-panel p-5">
      <Text className="font-ralewayExtraBold text-base text-textPrimary">
        Plan limits & features
      </Text>
      {subscribedTier &&
      subscribedTier !== "free" &&
      entitlement.effective_tier !== subscribedTier ? (
        <BillingSummaryRow
          label="Subscribed plan"
          value={
            entitlement.tiers.find((tier) => tier.key === subscribedTier)
              ?.label ?? subscribedTier
          }
        />
      ) : null}
      {entitlement.gating_enabled === false ? (
        <Text className="text-xs text-description">
          Plan quota enforcement is currently disabled.
        </Text>
      ) : null}
      {limits ? (
        <>
          <View className="gap-4">
            {quotaDimensions.map((dimension) =>
              limits[dimension] ? (
                <BillingUsageRow
                  key={dimension}
                  dimension={dimension}
                  usage={limits[dimension]}
                />
              ) : null,
            )}
          </View>
          <View className="border-t border-textPrimary/10 pt-2">
            {featureDimensions.map((dimension) => {
              const level = limits[dimension]?.level;
              if (!level) return null;
              return (
                <BillingSummaryRow
                  key={dimension}
                  label={dimensionLabels[dimension]}
                  value={
                    dimension === "reports_level" && level === "scheduled"
                      ? "CSV and PDF exports"
                      : dimension === "support_level"
                        ? supportLevelLabel(level)
                        : level.replaceAll("_", " ")
                  }
                />
              );
            })}
            {limits.retention_days || limits.retention_months ? (
              <Text className="mt-2 text-xs leading-5 text-description">
                {retentionDescription(entitlement)}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
      {entitlement.over_limit_dimensions?.length ? (
        <Text
          accessibilityRole="alert"
          className="text-xs leading-5 text-danger"
        >
          Over plan limits:{" "}
          {entitlement.over_limit_dimensions
            .map((key) => dimensionLabels[key] ?? key)
            .join(", ")}
          . Reduce usage or choose a larger plan.
        </Text>
      ) : null}
    </View>
  );
}
