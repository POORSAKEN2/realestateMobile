import type { PlanCapabilityKey } from "../../types/domain/billing";
import {
  hasPlanCapability,
  requiredTierForCapability,
} from "../../utils/billing/planCapabilities";
import { useBillingEntitlement } from "../api/useBillingEntitlement";

export function usePlanCapability(
  capability: PlanCapabilityKey,
  options?: { enabled?: boolean },
) {
  const entitlementQuery = useBillingEntitlement(options);

  return {
    ...entitlementQuery,
    hasAccess: hasPlanCapability(entitlementQuery.data, capability),
    requiredTier: requiredTierForCapability(capability, entitlementQuery.data),
  };
}
