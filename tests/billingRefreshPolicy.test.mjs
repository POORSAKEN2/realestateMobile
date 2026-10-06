import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { billingEntitlementRefreshInterval } = load(
  "../../utils/billing/billingRefreshPolicy.ts",
);
const { getBillingAccountState } = load(
  "../../utils/billing/billingAccountState.ts",
);
const info = {
  entitlements: {
    active: {
      professional_access: { productIdentifier: "professional_monthly" },
    },
  },
};
const trial = {
  tier: "professional",
  effective_tier: "professional",
  tier_label: "Professional",
  access_mode: "active",
  entitlement_source: "trial",
};

test("late webhook confirmation clears trial mismatch and slows automatic checks", () => {
  assert.equal(getBillingAccountState(trial, info).syncRequired, true);
  assert.equal(
    billingEntitlementRefreshInterval(trial, "professional", true),
    5_000,
  );
  const confirmed = { ...trial, entitlement_source: "purchase" };
  assert.equal(getBillingAccountState(confirmed, info).syncRequired, false);
  assert.equal(
    billingEntitlementRefreshInterval(confirmed, "professional", true),
    30_000,
  );
});

test("server expiry resumes fast checks without granting stale store access", () => {
  const expired = {
    ...trial,
    access_mode: "read_only",
    entitlement_source: "purchase",
  };
  assert.equal(getBillingAccountState(expired, info).syncRequired, true);
  assert.equal(
    billingEntitlementRefreshInterval(expired, "professional", true),
    5_000,
  );
});

test("unknown access retries quickly; no store purchase still checks server changes", () => {
  assert.equal(
    billingEntitlementRefreshInterval(undefined, "free", true),
    5_000,
  );
  assert.equal(billingEntitlementRefreshInterval(trial, "free", true), 30_000);
});

test("background app stops checks even when paid access is pending", () => {
  assert.equal(
    billingEntitlementRefreshInterval(undefined, "professional", false),
    false,
  );
  assert.equal(
    billingEntitlementRefreshInterval(trial, "professional", false),
    false,
  );
});
