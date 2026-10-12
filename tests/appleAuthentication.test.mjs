import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { createAppleAuthentication, isAppleCancellation } = load(
  "../../services/apple/appleAuthenticationCore.ts",
);

function setup({
  enabled = true,
  available = true,
  signIn,
  result = {
    status: "authenticated",
    access_token: "session",
    user: { id: "user" },
  },
} = {}) {
  const calls = [];
  const challenge = {
    challenge_id: "challenge",
    nonce: "nonce",
    state: "state",
  };
  const credential = {
    identityToken: "identity",
    authorizationCode: "code",
    state: "state",
    name: "Apple Owner",
  };
  const service = createAppleAuthentication({
    enabled: () => enabled,
    native: {
      isAvailable: async () => available,
      signIn:
        signIn ??
        (async (value) => {
          calls.push(["native", value]);
          return credential;
        }),
    },
    post: async (path, body, signal) => {
      calls.push([path, body, signal]);
      return { data: path.endsWith("/challenge") ? challenge : result };
    },
    toSession: ({ data }) => {
      if (!data?.access_token) throw new Error("Missing session");
      return { accessToken: data.access_token, user: data.user };
    },
  });
  return { service, calls, credential };
}

test("feature-off and unsupported platforms never request credentials", async () => {
  for (const options of [{ enabled: false }, { available: false }]) {
    const { service, calls } = setup(options);
    assert.equal(await service.isAvailable(), false);
    await assert.rejects(service.login(), /not available/);
    assert.deepEqual(calls, []);
  }
});

test("server challenge binds native sheet and verification before session creation", async () => {
  const { service, calls } = setup();
  const result = await service.login();
  assert.equal(result.session.accessToken, "session");
  assert.equal(calls[1][1].nonce, "nonce");
  assert.deepEqual(calls[2][1], {
    challenge_id: "challenge",
    state: "state",
    identity_token: "identity",
    authorization_code: "code",
  });
});

test("Apple cancellation does not send verification or create a session", async () => {
  const cancellation = { code: "ERR_REQUEST_CANCELED" };
  const { service, calls } = setup({
    signIn: async () => {
      throw cancellation;
    },
  });
  await assert.rejects(service.login(), (error) => isAppleCancellation(error));
  assert.equal(calls.length, 1);
});

test("unmount cancellation after native sheet prevents verification request", async () => {
  const controller = new AbortController();
  const { service, calls } = setup({
    signIn: async () => {
      controller.abort();
      return {
        identityToken: "identity",
        authorizationCode: "code",
        state: "state",
      };
    },
  });
  await assert.rejects(service.login(controller.signal), (error) =>
    isAppleCancellation(error),
  );
  assert.equal(calls.length, 1);
});

test("mismatched state and missing native credentials never reach server verification", async () => {
  for (const credential of [
    { identityToken: "identity", authorizationCode: "code", state: "other" },
    { state: "state" },
  ]) {
    const { service, calls } = setup({ signIn: async () => credential });
    await assert.rejects(service.login(), /valid credentials/);
    assert.equal(calls.length, 1);
  }
});

test("pending account preserves private relay email and first-time name without storing provider tokens", async () => {
  const { service } = setup({
    result: {
      status: "account_required",
      pending_token: "pending",
      email: "relay@privaterelay.appleid.com",
      can_register: true,
    },
  });
  assert.deepEqual(await service.login(), {
    status: "account_required",
    account: {
      pending_token: "pending",
      email: "relay@privaterelay.appleid.com",
      can_register: true,
      name: "Apple Owner",
    },
  });
});

test("link and signup use separate endpoints with pending proof in body", async () => {
  const { service, calls } = setup();
  const account = { pending_token: "pending" };
  await service.complete(account, {
    email: "existing@example.test",
    password: "password",
  });
  await service.complete(account, {
    name: "Owner",
    company: "Workspace",
    confirmation: true,
  });
  assert.equal(calls[0][0], "/auth/apple/link");
  assert.equal(calls[1][0], "/auth/apple/register");
  assert.equal(calls[0][1].pending_token, "pending");
  assert.equal(calls[1][1].password, undefined);
});

test("deletion reauthentication carries operation and request ID", async () => {
  const { service, calls } = setup({
    result: { status: "reauthenticated", reauth_token: "receipt" },
  });
  assert.equal(
    await service.reauthenticate("deletion_response", "request-id"),
    "receipt",
  );
  assert.deepEqual(calls[0].slice(0, 2), [
    "/auth/apple/reauth/challenge",
    { operation: "deletion_response", request_id: "request-id" },
  ]);
});

test("malformed backend sessions and wrong verification statuses cannot authenticate", async () => {
  for (const result of [
    { status: "authenticated" },
    { status: "reauthenticated", reauth_token: "receipt" },
    { status: "account_required" },
  ]) {
    const { service } = setup({ result });
    await assert.rejects(service.login());
  }
});
