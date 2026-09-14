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
    "Automated payment reminders and portfolio notifications",
    "Full analytics and scheduled reports",
  ]);
});
