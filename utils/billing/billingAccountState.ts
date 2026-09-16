import type { CustomerInfo } from "react-native-purchases";

import { REVENUECAT_PRODUCT_LABELS } from "../../constants/revenueCat";
import type { BillingEntitlement } from "../../types/domain/billing";
import { isBillingTierActivated } from "./billingSync";
import { effectiveSubscriptionTier } from "./planCapabilities";
import {
  getActiveRevenueCatProductId,
  getActiveRevenueCatTier,
  getRevenueCatProductKey,
} from "./revenueCatCustomer";

const TIER_LABELS = {
  starter: "Starter", professional: "Professional", portfolio: "Portfolio",
  free: "Free",
  tier1: "Tier 1",
  all_in: "All-In",
} as const;

export function getBillingAccountState(
  entitlement: BillingEntitlement | null | undefined,
  customerInfo: CustomerInfo | null,
) {
  const serverTier = effectiveSubscriptionTier(entitlement);
  const storeTier = getActiveRevenueCatTier(customerInfo);
  const productKey = getRevenueCatProductKey(
    getActiveRevenueCatProductId(customerInfo),
  );
  const storeLabel = productKey
    ? REVENUECAT_PRODUCT_LABELS[productKey]
    : storeTier === "free"
      ? "No active store purchase"
      : `${TIER_LABELS[storeTier]} purchase`;
  const syncRequired =
    storeTier !== "free" &&
    !isBillingTierActivated(entitlement ?? null, storeTier);

  return {
    serverLabel:
      entitlement?.tier_label?.trim() || TIER_LABELS[serverTier] || serverTier,
    serverTier,
    storeLabel,
    storeTier,
    syncRequired,
  };
}
