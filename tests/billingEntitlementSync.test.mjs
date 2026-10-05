import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { createBillingEntitlementSynchronizer } = load(
  "../../services/billing/billingEntitlementSync.ts",
);
const entitlement = (tier) => ({
  tier,
  effective_tier: tier,
  access_mode: "active",
  entitlement_source: "purchase",
});

function setup(reconcile, isCurrent = () => true) {
  const results = [];
  const statuses = [];
  const errors = [];
  const synchronizer = createBillingEntitlementSynchronizer({
    reconcile,
    isCurrent,
    onEntitlement: (value) => results.push(value),
    onStatus: (value) => statuses.push(value),
    onDelayed: (error) => errors.push(error),
    retryOptions: { delaysMs: [0] },
  });
  return { ...synchronizer, results, statuses, errors };
}

test("startup can recover paid backend access without SDK information", async () => {
  const sync = setup(async () => entitlement("professional"));
  await sync.synchronize("free", null, true);
  assert.equal(sync.results[0].effective_tier, "professional");
  assert.deepEqual(sync.statuses, ["syncing", "synchronized"]);
});

test("failed reconciliation retries unchanged customer info", async () => {
  let attempts = 0;
  const sync = setup(async () => {
    if (++attempts === 1) throw new Error("backend unavailable");
    return entitlement("professional");
  });
  await sync.synchronize("professional", "same-info");
  assert.equal(sync.statuses.at(-1), "delayed");
  await sync.synchronize("professional", "same-info");
  assert.equal(attempts, 2);
  assert.equal(sync.statuses.at(-1), "synchronized");
});

test("foreground forces reconciliation even when SDK fingerprint is unchanged", async () => {
  let attempts = 0;
  const sync = setup(async () => {
    attempts++;
    return entitlement("starter");
  });
  await sync.synchronize("starter", "same-info");
  await sync.synchronize("starter", "same-info");
  assert.equal(attempts, 1);
  await sync.synchronize("starter", "same-info", true);
  assert.equal(attempts, 2);
});

test("concurrent duplicate listeners share one request", async () => {
  let resolve;
  let attempts = 0;
  const sync = setup(() => {
    attempts++;
    return new Promise((done) => {
      resolve = done;
    });
  });
  const first = sync.synchronize("starter", "same-info");
  const duplicate = sync.synchronize("starter", "same-info");
  resolve(entitlement("starter"));
  await Promise.all([first, duplicate]);
  assert.equal(attempts, 1);
});

test("newer customer info replaces an in-flight entitlement result", async () => {
  let resolve;
  let attempts = 0;
  const sync = setup(() =>
    ++attempts === 1
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve(entitlement("portfolio")),
  );
  const first = sync.synchronize("starter", "starter-info");
  const latest = sync.synchronize("portfolio", "portfolio-info");
  resolve(entitlement("starter"));
  await Promise.all([first, latest]);
  assert.equal(attempts, 2);
  assert.deepEqual(
    sync.results.map((value) => value.effective_tier),
    ["portfolio"],
  );
});

test("returning to a previously synchronized fingerprint replaces queued changes", async () => {
  let resolve;
  let attempts = 0;
  const sync = setup(() =>
    ++attempts === 2
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve(entitlement("starter")),
  );
  await sync.synchronize("starter", "starter-info");
  const pending = sync.synchronize("portfolio", "portfolio-info");
  sync.synchronize("starter", "starter-info");
  resolve(entitlement("portfolio"));
  await pending;
  assert.equal(attempts, 3);
  assert.deepEqual(
    sync.results.map((value) => value.effective_tier),
    ["starter", "starter"],
  );
});

test("account changes discard pending results without publishing access", async () => {
  let current = true;
  let resolve;
  const sync = setup(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
    () => current,
  );
  const pending = sync.synchronize("professional", "same-info");
  current = false;
  resolve(entitlement("professional"));
  await pending;
  assert.deepEqual(sync.results, []);
  assert.deepEqual(sync.statuses, ["syncing"]);
});

test("manager or signed-out scope cannot trigger reconciliation", async () => {
  let attempts = 0;
  const sync = setup(
    async () => {
      attempts++;
      return entitlement("professional");
    },
    () => false,
  );
  await sync.synchronize("professional", "same-info", true);
  assert.equal(attempts, 0);
});
