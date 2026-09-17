export type SubscriptionTierKey = "free" | "tier1" | "all_in" | "starter" | "professional" | "portfolio";

export type PlanCapabilityKey =
  | "inquiry_actions"
  | "notifications"
  | "reminders"
  | "advanced_analytics";

export interface PlanCapability {
  enabled: boolean;
  required_tier: SubscriptionTierKey;
}

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
  excess?: number;
  current_plan: { key: string; label: string };
  required_plan: {
    key: string;
    label: string;
    price_php?: number | null;
  } | null;
  upgrade_path: string;
}

export interface PlanTier {
  key: SubscriptionTierKey | string;
  label: string;
  property_limit: number | null; // null means unlimited
  /** Dormant web-checkout metadata. Native purchase UI uses store prices. */
  price_php?: number | null;
  yearly_price_php?: number | null;
  capabilities?: Partial<Record<PlanCapabilityKey, boolean>>;
  limits?: {
    properties?: number | null;
    users?: number | null;
    storage_bytes?: number | null;
    published_listings?: number | null;
    retention_months?: number | null;
    analytics_depth?: string | null;
    reports_level?: string | null;
    retention_days?: number | null;
    support_level?: string | null;
  };
}

export type PurchasableTierKey = "starter" | "professional" | "portfolio";

export interface BillingEntitlement {
  catalog_version?: string;
  entitlement_source?: "trial" | "purchase" | "legacy" | "override";
  access_mode?: "active" | "read_only";
  trial_starts_at?: string | null;
  trial_ends_at?: string | null;
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
    retention_months?: { months: number | null };
    reports_level?: { level: string };
  };
  gating_enabled?: boolean;
  capabilities?: Partial<Record<PlanCapabilityKey, PlanCapability>>;
  can_create_property?: boolean;
  tier: SubscriptionTierKey | string;
  tier_label: string;
  property_limit: number | null;
  property_count: number;
  price_php?: number | null;
  tiers: PlanTier[];
}
