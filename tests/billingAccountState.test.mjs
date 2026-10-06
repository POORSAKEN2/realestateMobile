import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const { getBillingAccountState, getBillingStoreStatus } = load(
  "../../utils/billing/billingAccountState.ts",
);

function customerInfo(active = {}) {
  return {
    entitlements: { active },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
  };
}

test("flags an active store purchase missing from server access", () => {
  const state = getBillingAccountState(
    { tier: "free", effective_tier: "free", tier_label: "Free" },
    customerInfo({
      all_in_access: { productIdentifier: "all_in_lifetime" },
    }),
  );

  assert.equal(state.serverLabel, "Free");
  assert.equal(state.storeLabel, "All-In Lifetime");
  assert.equal(state.syncRequired, true);
});

test("does not flag a synchronized or higher server tier", () => {
  const state = getBillingAccountState(
    { tier: "all_in", effective_tier: "all_in", tier_label: "All-In" },
    customerInfo({
      tier1_access: { productIdentifier: "tier1_monthly" },
    }),
  );

  assert.equal(state.syncRequired, false);
});

test("unavailable billing data is distinct from confirmed free access", () => {
  const unknown = getBillingAccountState(null, null);
  assert.equal(unknown.serverLabel, "Unavailable");
  assert.equal(unknown.storeLabel, "Unavailable");
  const known = getBillingAccountState({ tier: "free" }, customerInfo());
  assert.equal(known.serverLabel, "Free");
  assert.equal(known.storeLabel, "No active store purchase");
});

test("store refresh failures retain purchase data with a stale-state warning", () => {
  assert.equal(
    getBillingStoreStatus(null, { isLoading: true, error: null }).label,
    "Checking store",
  );
  assert.equal(
    getBillingStoreStatus(null, { isLoading: false, error: "Offline" }).label,
    "Store unavailable",
  );
  assert.equal(
    getBillingStoreStatus(customerInfo({ all_in_access: {} }), {
      isLoading: false,
      error: "Offline",
    }).label,
    "Store check delayed",
  );
});

test("same-tier purchase distinguishes trial access until server confirms payment", () => {
  const info = customerInfo({
    professional_access: { productIdentifier: "professional_monthly" },
  });
  const trial = {
    tier: "professional",
    effective_tier: "professional",
    tier_label: "Professional",
    entitlement_source: "trial",
    access_mode: "active",
  };
  const pending = getBillingAccountState(trial, info);
  assert.equal(pending.serverLabel, "Professional trial");
  assert.equal(pending.storeLabel, "Professional Monthly");
  assert.equal(pending.syncRequired, true);
  const confirmed = getBillingAccountState(
    { ...trial, entitlement_source: "purchase" },
    info,
  );
  assert.equal(confirmed.serverLabel, "Professional");
  assert.equal(confirmed.syncRequired, false);
});

test("expired trial labels read-only access without claiming an active trial", () => {
  const state = getBillingAccountState(
    {
      tier: "professional",
      tier_label: "Professional",
      entitlement_source: "trial",
      access_mode: "read_only",
    },
    customerInfo({
      professional_access: { productIdentifier: "professional_monthly" },
    }),
  );
  assert.equal(state.serverLabel, "Professional (read-only)");
  assert.equal(state.syncRequired, true);
});
