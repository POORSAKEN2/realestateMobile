import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const {
  getActiveRevenueCatProductId,
  getActiveRevenueCatTier,
  getRevenueCatProductKey,
  hasRevenueCatPremium,
  indexRevenueCatPackages,
} = load("../../utils/billing/revenueCatCustomer.ts");

function customerInfo(active = {}) {
  return {
    entitlements: { active },
    activeSubscriptions: [],
    allPurchasedProductIdentifiers: [],
  };
}

test("server-aligned tier entitlements control premium access", () => {
  assert.equal(hasRevenueCatPremium(customerInfo()), false);
  assert.equal(
    hasRevenueCatPremium(
      customerInfo({ tier1_access: { productIdentifier: "tier1_monthly" } }),
    ),
    true,
  );
  assert.equal(
    hasRevenueCatPremium(
      customerInfo({ terrane_premium: { productIdentifier: "monthly" } }),
    ),
    false,
  );
  assert.equal(
    getActiveRevenueCatTier(
      customerInfo({
        tier1_access: { productIdentifier: "tier1_monthly" },
        all_in_access: { productIdentifier: "all_in_monthly" },
      }),
    ),
    "all_in",
  );
});

test("active entitlement maps exact configured product identifiers", () => {
  const info = customerInfo({
    all_in_access: { productIdentifier: "all_in_yearly" },
  });
  assert.equal(getActiveRevenueCatProductId(info), "all_in_yearly");
  assert.equal(getRevenueCatProductKey("tier1_lifetime"), "tier1_lifetime");
  assert.equal(getRevenueCatProductKey("tier1_yearly"), "tier1_yearly");
  assert.equal(getRevenueCatProductKey("all_in_monthly"), "all_in_monthly");
  assert.equal(getRevenueCatProductKey("Monthly"), null);
});

test("offering packages are indexed by store product, independent of order", () => {
  const monthly = { product: { identifier: "tier1_monthly" } };
  const lifetime = { product: { identifier: "all_in_lifetime" } };
  const indexed = indexRevenueCatPackages([monthly, lifetime]);

  assert.equal(indexed.all_in_lifetime, lifetime);
  assert.equal(indexed.tier1_monthly, monthly);
  assert.equal(indexed.tier1_yearly, null);
});
