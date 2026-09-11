import type { SubscriptionTierKey } from "../types/domain/billing";

export const REVENUECAT_ENTITLEMENT_IDS = {
  tier1: "tier1_access",
  all_in: "all_in_access",
} as const;

export const REVENUECAT_OFFERING_ID = "default";

export const REVENUECAT_PRODUCT_IDS = {
  tier1_lifetime:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_LIFETIME_PRODUCT_ID ??
    "tier1_lifetime",
  tier1_yearly:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_YEARLY_PRODUCT_ID ?? "tier1_yearly",
  tier1_monthly:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_MONTHLY_PRODUCT_ID ??
    "tier1_monthly",
  all_in_lifetime:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_LIFETIME_PRODUCT_ID ??
    "all_in_lifetime",
  all_in_yearly:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_YEARLY_PRODUCT_ID ?? "all_in_yearly",
  all_in_monthly:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_MONTHLY_PRODUCT_ID ??
    "all_in_monthly",
} as const;

export type RevenueCatProductKey = keyof typeof REVENUECAT_PRODUCT_IDS;

export const REVENUECAT_PRODUCT_LABELS: Record<RevenueCatProductKey, string> = {
  tier1_lifetime: "Tier 1 Lifetime",
  tier1_yearly: "Tier 1 Yearly",
  tier1_monthly: "Tier 1 Monthly",
  all_in_lifetime: "All-In Lifetime",
  all_in_yearly: "All-In Yearly",
  all_in_monthly: "All-In Monthly",
};

export function revenueCatEntitlementForTier(
  tier: Exclude<SubscriptionTierKey, "free">,
) {
  return REVENUECAT_ENTITLEMENT_IDS[tier];
}
