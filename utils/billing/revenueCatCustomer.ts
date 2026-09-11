import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";

import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_PRODUCT_IDS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";

export function hasRevenueCatPremium(customerInfo: CustomerInfo | null) {
  return Boolean(customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
}

export function getActiveRevenueCatProductId(
  customerInfo: CustomerInfo | null,
) {
  return (
    customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
      ?.productIdentifier ?? null
  );
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
