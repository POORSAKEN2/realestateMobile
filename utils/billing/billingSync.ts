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

export type BillingSyncStatus = "idle" | "syncing" | "synchronized" | "delayed";

export function isBillingTierActivated(
  entitlement: BillingEntitlement | null,
  targetTier: Exclude<SubscriptionTierKey, "free">,
) {
  if (!entitlement) return false;
  return (
    TIER_RANK[effectiveSubscriptionTier(entitlement)] >= TIER_RANK[targetTier]
  );
}

export async function reconcileBillingWithBackoff(
  reconcile: () => Promise<BillingEntitlement>,
  targetTier: SubscriptionTierKey,
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
  let lastError: unknown = null;

  for (const delayMs of delaysMs) {
    if (delayMs > 0) await sleep(delayMs);

    try {
      latest = await reconcile();
      lastError = null;
      if (targetTier === "free" || isBillingTierActivated(latest, targetTier)) {
        return {
          entitlement: latest,
          error: null,
          synchronized: true,
        } as const;
      }
    } catch (cause) {
      lastError = cause;
    }
  }

  return {
    entitlement: latest,
    error: lastError,
    synchronized: false,
  } as const;
}
