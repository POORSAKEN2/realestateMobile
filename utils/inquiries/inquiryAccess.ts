import type { BillingEntitlement } from "../../types/domain/billing";

const TIER_RANK: Readonly<Record<string, number>> = {
  free: 0,
  tier1: 1,
  all_in: 2,
};

export function hasInquiryWorkflowAccess(
  entitlement?: BillingEntitlement | null,
) {
  if (!entitlement) return false;
  const tier = entitlement.effective_tier ?? entitlement.tier ?? "free";
  return (TIER_RANK[tier] ?? 0) >= TIER_RANK.tier1;
}
