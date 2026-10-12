import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { readAppleCredentialState, createAppleCredentialMonitor } = load(
  "../../services/apple/appleCredentialState.ts",
);

function setup(read = async () => "authorized") {
  let token = "session-one";
  const reasons = [];
  const monitor = createAppleCredentialMonitor({
    token,
    currentToken: () => token,
    read,
    onInvalidate: (reason) => reasons.push(reason),
  });
  return {
    monitor,
    reasons,
    changeSession: () => {
      token = "session-two";
    },
  };
}

test("simulator checks never call native credential state or end the session", async () => {
  let calls = 0;
  const { monitor, reasons } = setup(() =>
    readAppleCredentialState(false, async () => {
      calls++;
      return "not_found";
    }),
  );
  await monitor.check();
  assert.equal(calls, 0);
  assert.deepEqual(reasons, []);
});

test("lookup failures are unknown, and authorized/transferred/unknown states retain sessions", async () => {
  assert.equal(
    await readAppleCredentialState(true, async () => {
      throw new Error("outage");
    }),
    "unknown",
  );
  for (const state of ["authorized", "transferred", "unknown"]) {
    const { monitor, reasons } = setup(async () => state);
    await monitor.check();
    assert.deepEqual(reasons, []);
  }
  const { monitor, reasons } = setup(async () => {
    throw new Error("outage");
  });
  await monitor.check();
  assert.deepEqual(reasons, []);
});

test("confirmed missing/revoked device credentials invalidate once with sanitized reason", async () => {
  for (const [state, expected] of [
    ["revoked", "apple_credential_revoked"],
    ["not_found", "apple_credential_not_found"],
  ]) {
    const { monitor, reasons } = setup(() =>
      readAppleCredentialState(true, async () => state),
    );
    await monitor.check();
    await monitor.check();
    monitor.revoke();
    assert.deepEqual(reasons, [expected]);
  }
});

test("foreground checks share one in-flight lookup", async () => {
  let resolve;
  let calls = 0;
  const { monitor, reasons } = setup(() => {
    calls++;
    return new Promise((complete) => {
      resolve = complete;
    });
  });
  const checking = monitor.check();
  await monitor.check();
  assert.equal(calls, 1);
  resolve("authorized");
  await checking;
  const second = monitor.check();
  assert.equal(calls, 2);
  resolve("unknown");
  await second;
  assert.deepEqual(reasons, []);
});

test("disposed and replaced sessions ignore late checks and revocation events", async () => {
  for (const dispose of [true, false]) {
    let resolve;
    const { monitor, reasons, changeSession } = setup(
      () =>
        new Promise((complete) => {
          resolve = complete;
        }),
    );
    const checking = monitor.check();
    if (dispose) monitor.dispose();
    else changeSession();
    resolve("revoked");
    await checking;
    monitor.revoke();
    assert.deepEqual(reasons, []);
  }
});

test("explicit native revocation still ends the current Apple session", () => {
  const { monitor, reasons } = setup();
  monitor.revoke();
  monitor.revoke();
  assert.deepEqual(reasons, ["apple_revocation_notification"]);
});
