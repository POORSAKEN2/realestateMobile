import type {
  BillingEntitlement,
  SubscriptionTierKey,
} from "../../types/domain/billing";
import { isBillingTierActivated } from "./billingSync";

export function billingEntitlementRefreshInterval(
  entitlement: BillingEntitlement | undefined,
  storeTier: SubscriptionTierKey,
  isForeground: boolean,
): number | false {
  if (!isForeground) return false;
  if (
    !entitlement ||
    (storeTier !== "free" && !isBillingTierActivated(entitlement, storeTier))
  )
    return 5_000;
  return 30_000;
}
