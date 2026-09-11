export const REVENUECAT_ENTITLEMENT_ID = "terrane_premium";

export const REVENUECAT_OFFERING_ID = "default";

export const REVENUECAT_PRODUCT_IDS = {
  lifetime: "lifetime",
  yearly: "yearly",
  monthly: "monthly",
} as const;

export type RevenueCatProductKey = keyof typeof REVENUECAT_PRODUCT_IDS;

export const REVENUECAT_PRODUCT_LABELS: Record<RevenueCatProductKey, string> = {
  lifetime: "Lifetime",
  yearly: "Yearly",
  monthly: "Monthly",
};
