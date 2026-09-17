import type { PurchasesPackage } from "react-native-purchases";

import {
  REVENUECAT_BILLING_PERIOD_LABELS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import type { PlanTier, SubscriptionTierKey } from "../../types/domain/billing";
import { getRevenueCatPackagesForTier } from "./revenueCatCustomer";

export const FALLBACK_PLAN_TIERS: PlanTier[] = [
  { key: "starter", label: "Starter", property_limit: 3 },
  { key: "professional", label: "Professional", property_limit: 15 },
  { key: "portfolio", label: "Portfolio", property_limit: 50 },
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
  if (!["starter", "professional", "portfolio", "tier1", "all_in"].includes(tier.key)) {
    return "Store price unavailable";
  }

  const firstPackage = getRevenueCatPackagesForTier(packages, tier.key as Exclude<SubscriptionTierKey, "free">)[0];
  return firstPackage
    ? `From ${formatRevenueCatPackagePrice(firstPackage.key, firstPackage.pkg)}`
    : "Store price unavailable";
}

export function getPlanTierFeatures(tier: PlanTier) {
  const limits = tier.limits;
  const features = [tier.property_limit === null ? "Unlimited managed properties" : `Up to ${tier.property_limit} managed properties`];
  if (limits?.users !== undefined) features.push(limits.users === null ? "Unlimited users, including account owner" : `${limits.users} total user${limits.users === 1 ? "" : "s"}, including account owner`);
  if (limits?.storage_bytes !== undefined && limits.storage_bytes !== null) features.push(`${limits.storage_bytes / 1024 ** 3} GB storage`);
  if (limits?.published_listings !== undefined) features.push(limits.published_listings === null ? "Unlimited published listings" : `${limits.published_listings} published listings`);
  if (limits?.retention_months !== undefined) features.push(limits.retention_months === null ? "Full history" : `${limits.retention_months}-month history`);
  features.push("Property, lease, rent, inquiry and reminder operations");
  if (limits?.reports_level) features.push(limits.reports_level === "csv" ? "CSV reports" : "CSV and PDF reports");
  if (limits?.analytics_depth === "full" || tier.capabilities?.advanced_analytics) features.push("Full analytics within available history");
  if (limits?.support_level === "priority") features.push("Priority support ticket classification");
  return features;
}

export function getMissingBillingPeriodLabels(keys: RevenueCatProductKey[]) {
  return keys.map((key) => REVENUECAT_BILLING_PERIOD_LABELS[key]);
}
