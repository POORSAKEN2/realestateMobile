import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const {
  getActiveRevenueCatProductId,
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

test("terrane_premium alone controls premium access", () => {
  assert.equal(hasRevenueCatPremium(customerInfo()), false);
  assert.equal(
    hasRevenueCatPremium(
      customerInfo({ terrane_premium: { productIdentifier: "monthly" } }),
    ),
    true,
  );
  assert.equal(
    hasRevenueCatPremium(
      customerInfo({ unrelated: { productIdentifier: "monthly" } }),
    ),
    false,
  );
});

test("active entitlement maps exact configured product identifiers", () => {
  const info = customerInfo({
    terrane_premium: { productIdentifier: "yearly" },
  });
  assert.equal(getActiveRevenueCatProductId(info), "yearly");
  assert.equal(getRevenueCatProductKey("lifetime"), "lifetime");
  assert.equal(getRevenueCatProductKey("yearly"), "yearly");
  assert.equal(getRevenueCatProductKey("monthly"), "monthly");
  assert.equal(getRevenueCatProductKey("Monthly"), null);
});

test("offering packages are indexed by store product, independent of order", () => {
  const monthly = { product: { identifier: "monthly" } };
  const lifetime = { product: { identifier: "lifetime" } };
  const indexed = indexRevenueCatPackages([monthly, lifetime]);

  assert.equal(indexed.lifetime, lifetime);
  assert.equal(indexed.monthly, monthly);
  assert.equal(indexed.yearly, null);
});
