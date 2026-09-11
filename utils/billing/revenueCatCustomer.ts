import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

import {
  REVENUECAT_ENTITLEMENT_IDS,
  REVENUECAT_PRODUCT_IDS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import type { SubscriptionTierKey } from "../../types/domain/billing";

export function hasRevenueCatPremium(customerInfo: CustomerInfo | null) {
  return getActiveRevenueCatTier(customerInfo) !== "free";
}

export function getActiveRevenueCatTier(
  customerInfo: CustomerInfo | null,
): SubscriptionTierKey {
  if (customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_IDS.all_in]) {
    return "all_in";
  }
  if (customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_IDS.tier1]) {
    return "tier1";
  }
  return "free";
}

export function getActiveRevenueCatProductId(
  customerInfo: CustomerInfo | null,
) {
  const tier = getActiveRevenueCatTier(customerInfo);
  if (tier === "free") return null;
  return customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_IDS[tier]]
    ?.productIdentifier ?? null;
}

export function getRevenueCatProductKey(
  productIdentifier: string | null,
): RevenueCatProductKey | null {
  if (!productIdentifier) return null;

  return (
    (Object.entries(REVENUECAT_PRODUCT_IDS).find(
      ([, identifier]) => identifier === productIdentifier,
    )?.[0] as RevenueCatProductKey | undefined) ?? null
  );
}

export function indexRevenueCatPackages(packages: PurchasesPackage[]) {
  const packageByProduct = new Map(
    packages.map((pkg) => [pkg.product.identifier, pkg]),
  );

  return Object.fromEntries(
    Object.entries(REVENUECAT_PRODUCT_IDS).map(([key, productId]) => [
      key,
      packageByProduct.get(productId) ?? null,
    ]),
  ) as Record<RevenueCatProductKey, PurchasesPackage | null>;
}
