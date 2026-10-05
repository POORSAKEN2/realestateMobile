import type {
  BillingEntitlement,
  SubscriptionTierKey,
} from "../../types/domain/billing";
import {
  reconcileBillingWithBackoff,
  type BillingSyncStatus,
} from "../../utils/billing/billingSync";

export function createBillingEntitlementSynchronizer(dependencies: {
  reconcile: () => Promise<BillingEntitlement>;
  isCurrent: () => boolean;
  onEntitlement: (entitlement: BillingEntitlement) => void | Promise<void>;
  onStatus: (status: BillingSyncStatus) => void;
  onDelayed: (error: unknown) => void;
  retryOptions?: Parameters<typeof reconcileBillingWithBackoff>[2];
}) {
  let completedFingerprint: string | null = null;
  let pending: {
    tier: SubscriptionTierKey;
    fingerprint: string | null;
  } | null = null;
  let worker: Promise<void> | null = null;
  let version = 0;

  function synchronize(
    tier: SubscriptionTierKey,
    fingerprint: string | null,
    force = false,
  ): Promise<void> {
    if (!dependencies.isCurrent()) return Promise.resolve();
    if (
      !force &&
      fingerprint !== null &&
      ((!worker && fingerprint === completedFingerprint) ||
        fingerprint === pending?.fingerprint)
    ) {
      return worker ?? Promise.resolve();
    }
    pending = { tier, fingerprint };
    version += 1;
    if (worker) return worker;

    const run = async () => {
      let handledVersion = 0;
      while (pending && handledVersion < version && dependencies.isCurrent()) {
        handledVersion = version;
        const request = pending;
        dependencies.onStatus("syncing");
        const result = await reconcileBillingWithBackoff(
          dependencies.reconcile,
          request.tier,
          {
            ...dependencies.retryOptions,
            shouldContinue: dependencies.isCurrent,
          },
        );
        if (!dependencies.isCurrent()) return;
        if (handledVersion !== version) continue;
        pending = null;
        if (result.entitlement)
          await dependencies.onEntitlement(result.entitlement);
        if (!dependencies.isCurrent()) return;
        if (result.synchronized) {
          completedFingerprint = request.fingerprint;
          dependencies.onStatus("synchronized");
        } else {
          dependencies.onStatus("delayed");
          dependencies.onDelayed(result.error);
        }
      }
    };
    worker = run().finally(() => {
      worker = null;
    });
    return worker;
  }

  return { synchronize };
}
