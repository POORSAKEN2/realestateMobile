import type {
  BillingEntitlement,
  PlanCapabilityKey,
  SubscriptionTierKey,
} from "../../types/domain/billing";

const TIER_RANK: Readonly<Record<SubscriptionTierKey, number>> = {
  free: 0,
  tier1: 1,
  all_in: 2,
};

const FALLBACK_REQUIREMENTS: Readonly<
  Record<PlanCapabilityKey, SubscriptionTierKey>
> = {
  inquiry_actions: "tier1",
  notifications: "tier1",
  reminders: "all_in",
  advanced_analytics: "all_in",
};

function normalizeTier(value?: string): SubscriptionTierKey {
  return value === "tier1" || value === "all_in" ? value : "free";
}

export function effectiveSubscriptionTier(
  entitlement?: BillingEntitlement | null,
): SubscriptionTierKey {
  return normalizeTier(entitlement?.effective_tier ?? entitlement?.tier);
}

export function requiredTierForCapability(
  capability: PlanCapabilityKey,
  entitlement?: BillingEntitlement | null,
): SubscriptionTierKey {
  return (
    entitlement?.capabilities?.[capability]?.required_tier ??
    FALLBACK_REQUIREMENTS[capability]
  );
}

export function hasPlanCapability(
  entitlement: BillingEntitlement | null | undefined,
  capability: PlanCapabilityKey,
) {
  if (!entitlement) return false;
  if (entitlement.gating_enabled === false) return true;

  const serverCapability = entitlement.capabilities?.[capability];
  if (serverCapability) return serverCapability.enabled;

  return (
    TIER_RANK[effectiveSubscriptionTier(entitlement)] >=
    TIER_RANK[FALLBACK_REQUIREMENTS[capability]]
  );
}
