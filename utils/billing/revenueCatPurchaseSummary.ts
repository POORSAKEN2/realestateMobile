import type {
  CustomerInfo,
  PurchasesEntitlementInfo,
} from "react-native-purchases";

import {
  REVENUECAT_BILLING_PERIOD_LABELS,
  REVENUECAT_ENTITLEMENT_IDS,
  REVENUECAT_PRODUCT_LABELS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import type { SubscriptionTierKey } from "../../types/domain/billing";
import { formatLocalizedDate } from "../formatters";
import {
  getActiveRevenueCatTier,
  getRevenueCatProductKey,
} from "./revenueCatCustomer";

type PaidSubscriptionTier = Exclude<SubscriptionTierKey, "free">;

export type RevenueCatPurchaseLifecycleStatus =
  | "active"
  | "lifetime"
  | "payment_issue"
  | "renewal_canceled"
  | "trial";

export type RevenueCatPurchaseSummary = {
  accessDateLabel: string;
  billingPeriodLabel: string;
  isLifetime: boolean;
  isTestPurchase: boolean;
  lifecycleLabel: string;
  lifecycleStatus: RevenueCatPurchaseLifecycleStatus;
  planLabel: string;
  productKey: RevenueCatProductKey;
  productLabel: string;
  storeLabel: string;
  tier: PaidSubscriptionTier;
};

const PLAN_LABELS: Record<PaidSubscriptionTier, string> = {
  starter: "Starter", professional: "Professional", portfolio: "Portfolio",
  tier1: "Tier 1",
  all_in: "All-In",
};

const STORE_LABELS: Readonly<Record<string, string>> = {
  AMAZON: "Amazon Appstore",
  APP_STORE: "App Store",
  EXTERNAL: "External store",
  GALAXY: "Galaxy Store",
  MAC_APP_STORE: "Mac App Store",
  PADDLE: "Paddle",
  PLAY_STORE: "Google Play",
  PROMOTIONAL: "Promotional access",
  RC_BILLING: "RevenueCat Billing",
  STRIPE: "Stripe",
  TEST_STORE: "RevenueCat Test Store",
  UNKNOWN_STORE: "Unknown store",
};

function activePaidEntitlement(customerInfo: CustomerInfo): {
  entitlement: PurchasesEntitlementInfo;
  tier: PaidSubscriptionTier;
} | null {
  const tier = getActiveRevenueCatTier(customerInfo);
  if (tier === "free") return null;

  const entitlement =
    customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_IDS[tier]];
  return entitlement ? { entitlement, tier } : null;
}

function formatPurchaseDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return formatLocalizedDate(value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function lifecycleStatus(
  entitlement: PurchasesEntitlementInfo,
  isLifetime: boolean,
): RevenueCatPurchaseLifecycleStatus {
  if (isLifetime) return "lifetime";
  if (entitlement.billingIssueDetectedAt) return "payment_issue";
  if (entitlement.periodType.toUpperCase() === "TRIAL") return "trial";
  if (!entitlement.willRenew) return "renewal_canceled";
  return "active";
}

function lifecycleLabel(status: RevenueCatPurchaseLifecycleStatus) {
  switch (status) {
    case "lifetime":
      return "Lifetime access";
    case "payment_issue":
      return "Payment issue";
    case "renewal_canceled":
      return "Renewal canceled";
    case "trial":
      return "Trial active";
    default:
      return "Active";
  }
}

function accessDateLabel(
  entitlement: PurchasesEntitlementInfo,
  status: RevenueCatPurchaseLifecycleStatus,
) {
  if (status === "lifetime") return "Permanent access";

  const expirationDate = formatPurchaseDate(entitlement.expirationDate);
  if (!expirationDate) return "Active access";
  if (status === "active") return `Renews on ${expirationDate}`;
  if (status === "trial" && entitlement.willRenew) {
    return `Trial ends on ${expirationDate}`;
  }
  return `Access until ${expirationDate}`;
}

function tierForProduct(
  productKey: RevenueCatProductKey,
): PaidSubscriptionTier {
  for (const tier of ["starter", "professional", "portfolio", "all_in", "tier1"] as const) {
    if (productKey.startsWith(`${tier}_`)) return tier;
  }
  throw new Error("Unknown purchased product.");
}

export function getRevenueCatPurchaseSummary(
  customerInfo: CustomerInfo,
  fallbackProductKey?: RevenueCatProductKey,
): RevenueCatPurchaseSummary | null {
  const active = activePaidEntitlement(customerInfo);
  const productKey =
    (active
      ? getRevenueCatProductKey(active.entitlement.productIdentifier)
      : null) ?? fallbackProductKey;
  if (!productKey) return null;

  const isLifetime = productKey.endsWith("_lifetime");
  const status = active
    ? lifecycleStatus(active.entitlement, isLifetime)
    : isLifetime
      ? "lifetime"
      : "active";
  const isTestPurchase = Boolean(
    active?.entitlement.isSandbox || active?.entitlement.store === "TEST_STORE",
  );
  const tier = active?.tier ?? tierForProduct(productKey);

  return {
    accessDateLabel: active
      ? accessDateLabel(active.entitlement, status)
      : isLifetime
        ? "Permanent access"
        : "Purchase confirmed",
    billingPeriodLabel: REVENUECAT_BILLING_PERIOD_LABELS[productKey],
    isLifetime,
    isTestPurchase,
    lifecycleLabel: lifecycleLabel(status),
    lifecycleStatus: status,
    planLabel: PLAN_LABELS[tier],
    productKey,
    productLabel: REVENUECAT_PRODUCT_LABELS[productKey],
    storeLabel: active
      ? (STORE_LABELS[active.entitlement.store] ??
        "Connected purchase provider")
      : "the connected purchase provider",
    tier,
  };
}
