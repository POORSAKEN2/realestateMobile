import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  assertPropertyTransition,
  canTransitionProperty,
  getAllowedPropertyTransitions,
  getPropertyLifecycleLabel,
  getPropertyLifecycleStepIndex,
  mergePropertyStatusHistory,
  PROPERTY_LIFECYCLE_SCOPE,
  PROPERTY_LIFECYCLE_STEPS,
} = load("../../utils/properties/propertyLifecycle.ts");

test("lifecycle applies at property level and maps backend states to BRD labels", () => {
  assert.equal(PROPERTY_LIFECYCLE_SCOPE, "property");
  assert.deepEqual(PROPERTY_LIFECYCLE_STEPS, [
    "IDLE",
    "UNDER_CONSTRUCTION",
    "PRE_LEASED",
    "REVENUE_GENERATING",
  ]);
  assert.equal(getPropertyLifecycleLabel("IDLE"), "Planned");
  assert.equal(getPropertyLifecycleLabel("UNDER_CONSTRUCTION"), "Building");
  assert.equal(getPropertyLifecycleLabel("PRE_LEASED"), "Ready for Rent");
  assert.equal(
    getPropertyLifecycleLabel("REVENUE_GENERATING"),
    "Revenue Generating",
  );
  assert.equal(getPropertyLifecycleStepIndex("PERSONAL_USE"), -1);
});

test("allowed transitions mirror the backend property transition graph", () => {
  assert.deepEqual(getAllowedPropertyTransitions("UNDER_CONSTRUCTION"), [
    "PRE_LEASED",
    "IDLE",
  ]);
  assert.deepEqual(getAllowedPropertyTransitions("PRE_LEASED"), [
    "REVENUE_GENERATING",
    "IDLE",
  ]);
  assert.equal(
    canTransitionProperty("REVENUE_GENERATING", "PERSONAL_USE"),
    true,
  );
  assert.equal(
    canTransitionProperty("REVENUE_GENERATING", "PRE_LEASED"),
    false,
  );
});

test("invalid lifecycle transitions fail before an API request", () => {
  assert.throws(
    () => assertPropertyTransition("UNDER_CONSTRUCTION", "PERSONAL_USE"),
    /Cannot move from Building to Personal Use/,
  );
  assert.doesNotThrow(() =>
    assertPropertyTransition("UNDER_CONSTRUCTION", "PRE_LEASED"),
  );
});

test("new transition history is ordered first without duplicate entries", () => {
  const entry = {
    id: "transition-2",
    fromStatus: "UNDER_CONSTRUCTION",
    toStatus: "PRE_LEASED",
    createdAt: "2026-09-08T02:00:00.000Z",
  };
  const existing = {
    id: "transition-1",
    fromStatus: "IDLE",
    toStatus: "UNDER_CONSTRUCTION",
    createdAt: "2026-09-07T02:00:00.000Z",
  };

  assert.deepEqual(mergePropertyStatusHistory([existing, entry], entry), [
    entry,
    existing,
  ]);
});
