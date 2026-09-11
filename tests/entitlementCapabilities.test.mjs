import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  hasAnalyticsDepth,
  remainingStorageBytes,
  retentionDescription,
  storageUploadError,
  supportLevelLabel,
  totalKnownUploadBytes,
} = load("../../utils/billing/entitlementCapabilities.ts");
const {
  effectiveSubscriptionTier,
  hasPlanCapability,
  requiredTierForCapability,
} = load("../../utils/billing/planCapabilities.ts");

const entitlement = {
  gating_enabled: true,
  limits: {
    analytics_depth: { level: "historical" },
    retention_days: { days: 1095 },
    storage_bytes: { limit: 1_000, used: 700, unlimited: false },
  },
};

test("analytics depth follows backend ordering", () => {
  assert.equal(hasAnalyticsDepth(entitlement, "current_period"), true);
  assert.equal(hasAnalyticsDepth(entitlement, "historical"), true);
  assert.equal(hasAnalyticsDepth(entitlement, "full"), false);
});

test("storage preflight compares known upload bytes with remaining quota", () => {
  assert.equal(totalKnownUploadBytes([{ size: 250 }, { size: 100 }]), 350);
  assert.equal(remainingStorageBytes(entitlement), 300);
  assert.match(storageUploadError(entitlement, [{ size: 350 }]), /300 B left/);
  assert.equal(storageUploadError(entitlement, [{ size: 300 }]), null);
  assert.equal(storageUploadError({ ...entitlement, gating_enabled: false }, [{ size: 500 }]), null);
});

test("plan labels stay human-readable", () => {
  assert.equal(retentionDescription(entitlement), "History retained for 3 years");
  assert.equal(supportLevelLabel("named_escalation"), "Named escalation support");
});

test("feature gates prefer backend capabilities and retain tier fallback", () => {
  assert.equal(hasPlanCapability({ tier: "tier1" }, "notifications"), true);
  assert.equal(hasPlanCapability({ tier: "tier1" }, "reminders"), false);
  assert.equal(
    hasPlanCapability(
      {
        tier: "all_in",
        capabilities: {
          advanced_analytics: { enabled: false, required_tier: "all_in" },
        },
      },
      "advanced_analytics",
    ),
    false,
  );
  assert.equal(
    hasPlanCapability(
      { tier: "free", gating_enabled: false },
      "advanced_analytics",
    ),
    true,
  );
  assert.equal(
    effectiveSubscriptionTier({ tier: "all_in", effective_tier: "tier1" }),
    "tier1",
  );
  assert.equal(requiredTierForCapability("reminders"), "all_in");
});
