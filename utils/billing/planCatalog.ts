import type { PurchasesPackage } from "react-native-purchases";

import {
  REVENUECAT_BILLING_PERIOD_LABELS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import type { PlanTier, SubscriptionTierKey } from "../../types/domain/billing";
import { getRevenueCatPackagesForTier } from "./revenueCatCustomer";

export const FALLBACK_PLAN_TIERS: PlanTier[] = [
  { key: "free", label: "Free", property_limit: 2 },
  { key: "tier1", label: "Tier 1", property_limit: 5 },
  { key: "all_in", label: "All-In", property_limit: null },
];

export function formatRevenueCatPackagePrice(
  key: RevenueCatProductKey,
  pkg: PurchasesPackage,
) {
  const price = pkg.product.priceString;
  if (key.endsWith("_monthly")) return `${price} / month`;
  if (key.endsWith("_yearly")) return `${price} / year`;
  return `${price} once`;
}

export function getTierStorePriceLabel(
  packages: Record<RevenueCatProductKey, PurchasesPackage | null>,
  tier: PlanTier,
) {
  if (tier.key === "free") return "Free";
  if (tier.key !== "tier1" && tier.key !== "all_in") {
    return "Store price unavailable";
  }

  const firstPackage = getRevenueCatPackagesForTier(packages, tier.key)[0];
  return firstPackage
    ? `From ${formatRevenueCatPackagePrice(firstPackage.key, firstPackage.pkg)}`
    : "Store price unavailable";
}

export function getPlanTierFeatures(tier: PlanTier) {
  const tierKey = tier.key as SubscriptionTierKey;
  const defaults = {
    inquiryActions: tierKey === "tier1" || tierKey === "all_in",
    notifications: tierKey === "tier1" || tierKey === "all_in",
    reminders: tierKey === "all_in",
    advancedAnalytics: tierKey === "all_in",
  };
  const capabilities = {
    inquiryActions:
      tier.capabilities?.inquiry_actions ?? defaults.inquiryActions,
    notifications: tier.capabilities?.notifications ?? defaults.notifications,
    reminders: tier.capabilities?.reminders ?? defaults.reminders,
    advancedAnalytics:
      tier.capabilities?.advanced_analytics ?? defaults.advancedAnalytics,
  };
  const propertyFeature =
    tier.property_limit === null
      ? "Unlimited managed properties"
      : `Up to ${tier.property_limit} managed properties`;

  if (capabilities.reminders || capabilities.advancedAnalytics) {
    return [
      propertyFeature,
      "Automated payment reminders and portfolio notifications",
      "Full analytics and scheduled reports",
    ];
  }

  if (capabilities.inquiryActions || capabilities.notifications) {
    return [
      propertyFeature,
      "Inquiry actions and portfolio notifications",
      "Historical analytics and PDF reports",
    ];
  }

  return [
    propertyFeature,
    "Core property, lease, and rent management",
    "Current-period analytics and CSV reports",
  ];
}

export function getMissingBillingPeriodLabels(keys: RevenueCatProductKey[]) {
  return keys.map((key) => REVENUECAT_BILLING_PERIOD_LABELS[key]);
}
