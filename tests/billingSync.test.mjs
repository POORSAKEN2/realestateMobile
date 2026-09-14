import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const { isBillingTierActivated, waitForBillingTier } = load(
  "../../utils/billing/billingSync.ts",
);

function entitlement(tier) {
  return { tier, effective_tier: tier };
}

test("higher server tier satisfies a lower purchased tier", () => {
  assert.equal(isBillingTierActivated(entitlement("all_in"), "tier1"), true);
  assert.equal(isBillingTierActivated(entitlement("free"), "tier1"), false);
});

test("post-purchase polling tolerates failures and stops when access activates", async () => {
  const responses = [
    new Error("offline"),
    entitlement("free"),
    entitlement("tier1"),
  ];
  const result = await waitForBillingTier(
    async () => {
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    "tier1",
    { delaysMs: [0, 1, 1], sleep: async () => undefined },
  );

  assert.equal(result.synchronized, true);
  assert.equal(result.entitlement.effective_tier, "tier1");
});

test("post-purchase polling reports pending without failing the purchase", async () => {
  const result = await waitForBillingTier(
    async () => entitlement("free"),
    "all_in",
    { delaysMs: [0, 1], sleep: async () => undefined },
  );

  assert.equal(result.synchronized, false);
});
