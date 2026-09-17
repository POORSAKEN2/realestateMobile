import assert from "node:assert/strict";
import test from "node:test";

import load from "./helpers/loadTs.cjs";

const { getPlanTierFeatures, getTierStorePriceLabel } = load(
  "../../utils/billing/planCatalog.ts",
);

const emptyPackages = {
  tier1_lifetime: null,
  tier1_yearly: null,
  tier1_monthly: null,
  all_in_lifetime: null,
  all_in_yearly: null,
  all_in_monthly: null,
};

test("native plan pricing uses the localized store price", () => {
  const packages = {
    ...emptyPackages,
    tier1_monthly: { product: { priceString: "₱299.00" } },
  };

  assert.equal(
    getTierStorePriceLabel(packages, {
      key: "tier1",
      label: "Tier 1",
      property_limit: 5,
      price_php: 9999,
    }),
    "From ₱299.00 / month",
  );
});

test("plan features follow server capability metadata", () => {
  const features = getPlanTierFeatures({
    key: "all_in",
    label: "All-In",
    property_limit: null,
    capabilities: { reminders: true, advanced_analytics: true },
  });

  assert.deepEqual(features, [
    "Unlimited managed properties",
    "Property, lease, rent, inquiry and reminder operations",
    "Full analytics within available history",
  ]);
});

test("new commercial cards describe actual limits and omit deferred services", () => {
  const features = getPlanTierFeatures({ key: "professional", property_limit: 15, limits: {
    users: 5, storage_bytes: 20 * 1024 ** 3, published_listings: 15, retention_months: 36,
    analytics_depth: "full", reports_level: "csv_pdf", support_level: "priority",
  } });
  assert.ok(features.includes("5 total users, including account owner"));
  assert.ok(features.includes("36-month history"));
  assert.ok(features.includes("CSV and PDF reports"));
  assert.ok(features.every(item => !/scheduled|SLA/i.test(item)));
});
