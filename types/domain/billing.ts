export type SubscriptionTierKey = "free" | "tier1" | "all_in";

export interface UsageLimit {
  limit: number | null;
  used: number;
  unlimited: boolean;
}

export interface PlanChangeBlocker {
  dimension: string;
  current: number;
  target_limit: number;
  excess: number;
}

export interface PlanChangePreview {
  allowed: boolean;
  blockers: PlanChangeBlocker[];
}

export interface EntitlementLimitDetails {
  dimension: string;
  limit: number | string;
  current: number | string;
  requested: number;
  current_plan: { key: string; label: string };
  required_plan: { key: string; label: string; price_php?: number | null } | null;
  upgrade_path: string;
}

export interface PlanTier {
  key: SubscriptionTierKey | string;
  label: string;
  property_limit: number | null; // null means unlimited
  price_php: number;
}

export interface BillingEntitlement {
  subscribed_tier?: string;
  effective_tier?: string;
  status?: string | null;
  current_period_end?: string | null;
  in_grace_period?: boolean;
  grace_ends_at?: string | null;
  over_limit_dimensions?: string[];
  limits?: {
    properties: UsageLimit;
    published_listings: UsageLimit;
    storage_bytes: UsageLimit;
    users: UsageLimit;
    analytics_depth?: { level: string };
    support_level?: { level: string };
    retention_days?: { days: number | null };
    reports_level?: { level: string };
  };
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
  tier: "tier1" | "all_in";
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  checkout_url?: string;
  session_id?: string;
}
