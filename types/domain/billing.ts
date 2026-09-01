export type SubscriptionTierKey = "free" | "tier_1" | "all_in";

export interface PlanTier {
  key: SubscriptionTierKey | string;
  label: string;
  property_limit: number | null; // null means unlimited
  price_php: number;
}

export interface BillingEntitlement {
  gating_enabled?: boolean;
  can_create_property?: boolean;
  tier: SubscriptionTierKey | string;
  tier_label: string;
  property_limit: number | null;
  property_count: number;
  price_php: number;
  tiers: PlanTier[];
}

export interface CheckoutSessionPayload {
  tier: "tier_1" | "all_in" | string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url?: string;
  session_id?: string;
}
