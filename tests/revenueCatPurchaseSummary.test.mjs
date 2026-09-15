import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const { getRevenueCatPurchaseSummary } = load(
  "../../utils/billing/revenueCatPurchaseSummary.ts",
);

function entitlement(overrides = {}) {
  return {
    billingIssueDetectedAt: null,
    expirationDate: "2026-10-01T00:00:00Z",
    isSandbox: false,
    periodType: "NORMAL",
    productIdentifier: "tier1_monthly",
    store: "APP_STORE",
    willRenew: true,
    ...overrides,
  };
}

function customerInfo(active = {}) {
  return {
    entitlements: { active },
  };
}

test("prioritizes inherited All-In entitlement and identifies test purchases", () => {
  const summary = getRevenueCatPurchaseSummary(
    customerInfo({
      tier1_access: entitlement(),
      all_in_access: entitlement({
        isSandbox: true,
        productIdentifier: "all_in_monthly",
        store: "TEST_STORE",
      }),
    }),
  );

  assert.equal(summary.planLabel, "All-In");
  assert.equal(summary.billingPeriodLabel, "Monthly");
  assert.equal(summary.lifecycleLabel, "Active");
  assert.equal(summary.accessDateLabel, "Renews on October 1, 2026");
  assert.equal(summary.storeLabel, "RevenueCat Test Store");
  assert.equal(summary.isTestPurchase, true);
});

test("shows a renewing yearly trial with its trial end date", () => {
  const summary = getRevenueCatPurchaseSummary(
    customerInfo({
      tier1_access: entitlement({
        periodType: "TRIAL",
        productIdentifier: "tier1_yearly",
      }),
    }),
  );

  assert.equal(summary.billingPeriodLabel, "Yearly");
  assert.equal(summary.lifecycleLabel, "Trial active");
  assert.equal(summary.accessDateLabel, "Trial ends on October 1, 2026");
});

test("shows paid access end date when renewal was canceled", () => {
  const summary = getRevenueCatPurchaseSummary(
    customerInfo({
      tier1_access: entitlement({ willRenew: false }),
    }),
  );

  assert.equal(summary.lifecycleLabel, "Renewal canceled");
  assert.equal(summary.accessDateLabel, "Access until October 1, 2026");
});

test("shows payment issue without promising renewal", () => {
  const summary = getRevenueCatPurchaseSummary(
    customerInfo({
      tier1_access: entitlement({
        billingIssueDetectedAt: "2026-09-15T00:00:00Z",
      }),
    }),
  );

  assert.equal(summary.lifecycleLabel, "Payment issue");
  assert.equal(summary.accessDateLabel, "Access until October 1, 2026");
});

test("shows lifetime purchases as permanent access", () => {
  const summary = getRevenueCatPurchaseSummary(
    customerInfo({
      all_in_access: entitlement({
        expirationDate: null,
        productIdentifier: "all_in_lifetime",
        willRenew: false,
      }),
    }),
  );

  assert.equal(summary.billingPeriodLabel, "Lifetime");
  assert.equal(summary.lifecycleLabel, "Lifetime access");
  assert.equal(summary.accessDateLabel, "Permanent access");
  assert.equal(summary.isLifetime, true);
});

test("falls back to the purchased package while RevenueCat refreshes entitlements", () => {
  const summary = getRevenueCatPurchaseSummary(customerInfo(), "tier1_yearly");

  assert.equal(summary.planLabel, "Tier 1");
  assert.equal(summary.billingPeriodLabel, "Yearly");
  assert.equal(summary.accessDateLabel, "Purchase confirmed");
});
