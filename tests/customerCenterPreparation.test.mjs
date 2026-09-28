import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { prepareCustomerCenterWithTimeout } = load(
  "../../utils/billing/customerCenterPreparation.ts",
);

test("customer center preparation resolves without waiting for its timeout", async () => {
  let calls = 0;
  await prepareCustomerCenterWithTimeout(async () => {
    calls++;
  }, 100);
  assert.equal(calls, 1);
});

test("customer center preparation preserves actionable SDK failures", async () => {
  const error = new Error("Missing RevenueCat API key.");
  await assert.rejects(
    prepareCustomerCenterWithTimeout(async () => {
      throw error;
    }, 100),
    (cause) => cause === error,
  );
});

test("stalled preparation fails clearly rather than locking management", async () => {
  await assert.rejects(
    prepareCustomerCenterWithTimeout(() => new Promise(() => {}), 5),
    /Subscription management could not start/,
  );
});

test("late SDK completion cannot turn a timeout into reported success", async () => {
  let finish;
  const stalled = new Promise((resolve) => {
    finish = resolve;
  });
  const operation = prepareCustomerCenterWithTimeout(() => stalled, 5);
  await assert.rejects(operation, /Subscription management could not start/);
  finish();
});
