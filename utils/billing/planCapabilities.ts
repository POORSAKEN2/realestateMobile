import type {
  BillingEntitlement,
  PlanCapabilityKey,
  SubscriptionTierKey,
} from "../../types/domain/billing";

const TIER_RANK: Readonly<Record<SubscriptionTierKey, number>> = {
  starter: 1, professional: 2, portfolio: 3,
  free: 0,
  tier1: 1,
  all_in: 2,
};

const FALLBACK_REQUIREMENTS: Readonly<
  Record<PlanCapabilityKey, SubscriptionTierKey>
> = {
  inquiry_actions: "starter",
  notifications: "starter",
  reminders: "starter",
  advanced_analytics: "starter",
};

function normalizeTier(value?: string): SubscriptionTierKey {
  return value && value in TIER_RANK ? value as SubscriptionTierKey : "free";
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

  if (capability !== "advanced_analytics") return true;
  const serverCapability = entitlement.capabilities?.[capability];
  if (serverCapability) return serverCapability.enabled;

  return ["all_in", "starter", "professional", "portfolio"].includes(
    effectiveSubscriptionTier(entitlement),
  );
}
