export const REVENUECAT_ENTITLEMENT_IDS = {
  starter: "starter_access",
  professional: "professional_access",
  portfolio: "portfolio_access",
  tier1: "tier1_access",
  all_in: "all_in_access",
} as const;

export const REVENUECAT_OFFERING_ID = "default";

export const REVENUECAT_PRODUCT_IDS = {
  starter_monthly: process.env.EXPO_PUBLIC_REVENUECAT_STARTER_MONTHLY_PRODUCT_ID ?? "starter_monthly",
  starter_yearly: process.env.EXPO_PUBLIC_REVENUECAT_STARTER_YEARLY_PRODUCT_ID ?? "starter_yearly",
  professional_monthly: process.env.EXPO_PUBLIC_REVENUECAT_PROFESSIONAL_MONTHLY_PRODUCT_ID ?? "professional_monthly",
  professional_yearly: process.env.EXPO_PUBLIC_REVENUECAT_PROFESSIONAL_YEARLY_PRODUCT_ID ?? "professional_yearly",
  portfolio_monthly: process.env.EXPO_PUBLIC_REVENUECAT_PORTFOLIO_MONTHLY_PRODUCT_ID ?? "portfolio_monthly",
  portfolio_yearly: process.env.EXPO_PUBLIC_REVENUECAT_PORTFOLIO_YEARLY_PRODUCT_ID ?? "portfolio_yearly",
  tier1_lifetime:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_LIFETIME_PRODUCT_ID ??
    "tier1_lifetime",
  tier1_yearly:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_YEARLY_PRODUCT_ID ??
    "tier1_yearly",
  tier1_monthly:
    process.env.EXPO_PUBLIC_REVENUECAT_TIER1_MONTHLY_PRODUCT_ID ??
    "tier1_monthly",
  all_in_lifetime:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_LIFETIME_PRODUCT_ID ??
    "all_in_lifetime",
  all_in_yearly:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_YEARLY_PRODUCT_ID ??
    "all_in_yearly",
  all_in_monthly:
    process.env.EXPO_PUBLIC_REVENUECAT_ALL_IN_MONTHLY_PRODUCT_ID ??
    "all_in_monthly",
} as const;

export type RevenueCatProductKey = keyof typeof REVENUECAT_PRODUCT_IDS;

export const REVENUECAT_PRODUCT_KEYS_BY_TIER = {
  starter: ["starter_monthly", "starter_yearly"],
  professional: ["professional_monthly", "professional_yearly"],
  portfolio: ["portfolio_monthly", "portfolio_yearly"],
  tier1: ["tier1_monthly", "tier1_yearly", "tier1_lifetime"],
  all_in: ["all_in_monthly", "all_in_yearly", "all_in_lifetime"],
} as const satisfies Record<
  "tier1" | "all_in" | "starter" | "professional" | "portfolio",
  readonly RevenueCatProductKey[]
>;

export const REVENUECAT_PRODUCT_LABELS: Record<RevenueCatProductKey, string> = {
  starter_monthly: "Starter Monthly",
  starter_yearly: "Starter Yearly",
  professional_monthly: "Professional Monthly",
  professional_yearly: "Professional Yearly",
  portfolio_monthly: "Portfolio Monthly",
  portfolio_yearly: "Portfolio Yearly",
  tier1_lifetime: "Tier 1 Lifetime",
  tier1_yearly: "Tier 1 Yearly",
  tier1_monthly: "Tier 1 Monthly",
  all_in_lifetime: "All-In Lifetime",
  all_in_yearly: "All-In Yearly",
  all_in_monthly: "All-In Monthly",
};

export const REVENUECAT_BILLING_PERIOD_LABELS: Record<
  RevenueCatProductKey,
  string
> = {
  starter_monthly: "Monthly",
  starter_yearly: "Yearly",
  professional_monthly: "Monthly",
  professional_yearly: "Yearly",
  portfolio_monthly: "Monthly",
  portfolio_yearly: "Yearly",
  tier1_lifetime: "Lifetime",
  tier1_yearly: "Yearly",
  tier1_monthly: "Monthly",
  all_in_lifetime: "Lifetime",
  all_in_yearly: "Yearly",
  all_in_monthly: "Monthly",
};
