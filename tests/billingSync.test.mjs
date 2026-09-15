import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const { isBillingTierActivated, reconcileBillingWithBackoff } = load(
  "../../utils/billing/billingSync.ts",
);

function entitlement(tier) {
  return { tier, effective_tier: tier };
}

test("higher server tier satisfies a lower purchased tier", () => {
  assert.equal(isBillingTierActivated(entitlement("all_in"), "tier1"), true);
  assert.equal(isBillingTierActivated(entitlement("free"), "tier1"), false);
});

test("automatic reconciliation retries until RevenueCat confirms access", async () => {
  const responses = [
    new Error("not ready"),
    entitlement("free"),
    entitlement("all_in"),
  ];
  const result = await reconcileBillingWithBackoff(
    async () => {
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    "all_in",
    { delaysMs: [0, 1, 1], sleep: async () => undefined },
  );

  assert.equal(result.synchronized, true);
  assert.equal(result.entitlement.effective_tier, "all_in");
});

test("automatic reconciliation reports delayed without trusting client access", async () => {
  const result = await reconcileBillingWithBackoff(
    async () => {
      throw new Error("backend unavailable");
    },
    "tier1",
    { delaysMs: [0, 1], sleep: async () => undefined },
  );

  assert.equal(result.synchronized, false);
  assert.equal(result.entitlement, null);
  assert.match(result.error.message, /backend unavailable/);
});
