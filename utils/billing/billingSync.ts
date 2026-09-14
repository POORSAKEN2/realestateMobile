import type {
  BillingEntitlement,
  SubscriptionTierKey,
} from "../../types/domain/billing";
import { effectiveSubscriptionTier } from "./planCapabilities";

const TIER_RANK: Readonly<Record<SubscriptionTierKey, number>> = {
  free: 0,
  tier1: 1,
  all_in: 2,
};

const DEFAULT_DELAYS_MS = [0, 2_000, 4_000, 8_000, 8_000, 8_000] as const;

export function isBillingTierActivated(
  entitlement: BillingEntitlement | null,
  targetTier: Exclude<SubscriptionTierKey, "free">,
) {
  if (!entitlement) return false;
  return (
    TIER_RANK[effectiveSubscriptionTier(entitlement)] >= TIER_RANK[targetTier]
  );
}

export async function waitForBillingTier(
  fetchEntitlement: () => Promise<BillingEntitlement>,
  targetTier: Exclude<SubscriptionTierKey, "free">,
  options: {
    delaysMs?: readonly number[];
    sleep?: (milliseconds: number) => Promise<void>;
  } = {},
) {
  const delaysMs = options.delaysMs ?? DEFAULT_DELAYS_MS;
  const sleep =
    options.sleep ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  let latest: BillingEntitlement | null = null;

  for (const delayMs of delaysMs) {
    if (delayMs > 0) await sleep(delayMs);

    try {
      latest = await fetchEntitlement();
      if (isBillingTierActivated(latest, targetTier)) {
        return { entitlement: latest, synchronized: true } as const;
      }
    } catch {
      // A store purchase remains successful even when the server is briefly
      // unreachable. Continue the bounded retries, then show sync-pending UI.
    }
  }

  return { entitlement: latest, synchronized: false } as const;
}
