import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import load from "./helpers/loadTs.cjs";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const {
  ApiError,
  toApiError,
  toTransportError,
  SERVER_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
} = load("../../api/errors.ts");
const { parseApiResponse } = load("../../api/response.ts");
const { authErrorFeedback } = load("../../utils/auth/authErrorFeedback.ts");
const { createAppleAuthentication } = load(
  "../../services/apple/appleAuthenticationCore.ts",
);
const { setSessionAccess } = load("../../services/access/sessionAccess.ts");
const id = "00000000-1111-4222-8333-444444444444";
const secret =
  "SQLSTATE[42501]: permission denied for table cache (Host: 127.0.0.1, Database: private, SQL: select secret)";
const filename = (path) => fileURLToPath(new URL(path, import.meta.url));

test("server failures discard debug messages, secret details and arbitrary error codes", () => {
  for (const status of [500, 502, 503]) {
    const error = toApiError(status, {
      message: secret,
      errors: { password: "private" },
      error: "secret-code",
      request_id: id,
    });
    assert.equal(error.message, SERVER_ERROR_MESSAGE);
    assert.equal(error.details, undefined);
    assert.equal(error.requestId, id);
    assert.equal(error.retryable, true);
    assert.equal(authErrorFeedback(error).title, "Unable to sign in");
    assert.equal(authErrorFeedback(error).message.includes("SQLSTATE"), false);
  }
  assert.equal(
    toApiError(422, { message: secret }).message,
    SERVER_ERROR_MESSAGE,
  );
  assert.equal(
    toApiError(500, { request_id: "token-secret" }).requestId,
    undefined,
  );
});

test("safe validation, credentials and entitlement responses stay meaningful", () => {
  assert.equal(
    toApiError(422, { errors: { email: ["Enter a valid email."] } }).message,
    "Enter a valid email.",
  );
  assert.equal(
    authErrorFeedback(
      toApiError(422, {
        message: "These credentials do not match our records.",
      }),
    ).message,
    "Email or password is incorrect.",
  );
  const error = toApiError(403, {
    error: "entitlement_limit_reached",
    message: "Storage is full.",
    errors: { dimension: "storage" },
  });
  assert.equal(error.message, "Storage is full.");
  assert.equal(error.details.dimension, "storage");
  assert.equal(error.retryable, false);
});

test("Fetch handles JSON/HTML/malformed server errors and correlates valid request IDs", async () => {
  for (const [body, contentType] of [
    [JSON.stringify({ message: secret }), "application/json"],
    ["<html>stack trace secret</html>", "text/html"],
    ["{broken", "application/json"],
  ]) {
    await assert.rejects(
      parseApiResponse(
        new Response(body, {
          status: 500,
          headers: { "Content-Type": contentType, "X-Request-ID": id },
        }),
        "Login failed",
      ),
      (error) =>
        error instanceof ApiError &&
        error.message === SERVER_ERROR_MESSAGE &&
        error.requestId === id,
    );
  }
  for (const [body, contentType] of [
    ["<html>secret</html>", "text/html"],
    ["{broken", "application/json"],
    ["null", "application/json"],
  ]) {
    await assert.rejects(
      parseApiResponse(
        new Response(body, { headers: { "Content-Type": contentType } }),
        "Login failed",
      ),
      (error) =>
        error.code === "invalid_response" &&
        error.retryable &&
        error.message === SERVER_ERROR_MESSAGE,
    );
  }
  assert.deepEqual(
    await parseApiResponse(
      new Response('{"data":{"id":1}}', {
        headers: { "Content-Type": "application/json" },
      }),
      "failed",
    ),
    { data: { id: 1 } },
  );
});

test("Axios normalizes server errors and network outages without treating cancellation as failure", async () => {
  setSessionAccess(null);
  let failure = {
    response: {
      status: 503,
      data: { message: secret },
      headers: { "x-request-id": id },
    },
  };
  let response = null;
  const { apiClient } = loadWithMocks(filename("../api/client.ts"), {
    "./config": { API_BASE_URL: "http://example.test/api" },
    "./axios": {
      axiosInstance: async () => {
        if (failure) throw failure;
        return response;
      },
    },
  });
  await assert.rejects(
    apiClient.post("/auth/apple/challenge"),
    (error) =>
      error.status === 503 &&
      error.requestId === id &&
      error.message === SERVER_ERROR_MESSAGE,
  );
  failure = { request: {}, message: "Network Error" };
  await assert.rejects(
    apiClient.post("/auth/apple/challenge"),
    (error) =>
      error.code === "network_error" &&
      authErrorFeedback(error).title === "Connection problem" &&
      error.message === NETWORK_ERROR_MESSAGE,
  );
  failure = { code: "ERR_CANCELED" };
  await assert.rejects(
    apiClient.post("/auth/apple/challenge"),
    (error) => error === failure,
  );
  failure = null;
  response = { status: 200, data: "<html>secret</html>" };
  await assert.rejects(
    apiClient.post("/auth/apple/challenge"),
    (error) =>
      error.code === "invalid_response" &&
      error.message === SERVER_ERROR_MESSAGE,
  );
  response = { status: 200, data: { data: { challenge_id: "test" } } };
  assert.deepEqual(
    await apiClient.post("/auth/apple/challenge"),
    response.data,
  );
});

test("Retry-After supports seconds/dates and transport aborts remain quiet", (t) => {
  t.mock.method(Date, "now", () => Date.parse("2026-10-12T00:00:00Z"));
  const limited = toApiError(429, { message: secret }, { retryAfter: "30" });
  assert.equal(limited.retryAfterSeconds, 30);
  assert.equal(limited.message, SERVER_ERROR_MESSAGE);
  const safe = toApiError(
    429,
    {},
    { retryAfter: "Mon, 12 Oct 2026 00:01:00 GMT" },
  );
  assert.equal(safe.retryAfterSeconds, 60);
  assert.equal(safe.message, "Too many attempts. Please try again later.");
  assert.equal(
    toApiError(429, {}, { retryAfter: "nonsense" }).retryAfterSeconds,
    undefined,
  );
  const abort = new DOMException("Cancelled", "AbortError");
  assert.equal(toTransportError(abort), abort);
});

test("login failure preserves entered fields, exposes retry, and raises no duplicate alert", async () => {
  const states = [];
  let cursor = 0;
  let alerts = 0;
  let calls = 0;
  let succeeds = false;
  const { useLogin } = loadWithMocks(filename("../hooks/useLogin.ts"), {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value) => {
            states[index] = value;
          },
        ];
      },
    },
    "react-native": {
      Alert: {
        alert() {
          alerts++;
        },
      },
    },
    "expo-router": { router: { replace() {} } },
    "../api/client": { API_BASE_URL: "http://example.test/api" },
    "./useAuth": { useAuth: () => ({ signIn() {} }) },
    "./auth/useAuthRetryDelay": { useAuthRetryDelay: () => 0 },
    "../utils/auth/authSession": {
      sessionFromAuthResponse: () => ({ accessToken: "test" }),
    },
  });
  const render = () => {
    cursor = 0;
    return useLogin("entered@example.test");
  };
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify(
        succeeds ? { data: { access_token: "test" } } : { message: secret },
      ),
      {
        status: succeeds ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
  try {
    render().setPassword("user-password");
    await render().handleLogin();
    const failed = render();
    assert.equal(failed.email, "entered@example.test");
    assert.equal(failed.password, "user-password");
    assert.equal(failed.error.retryable, true);
    assert.equal(failed.error.message, SERVER_ERROR_MESSAGE);
    assert.equal(alerts, 0);
    succeeds = true;
    await failed.handleLogin();
    assert.equal(render().error, null);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("Apple retry obtains a fresh challenge and code rather than replaying credentials", async () => {
  let attempt = 0;
  const submitted = [];
  const service = createAppleAuthentication({
    enabled: () => true,
    native: {
      isAvailable: async () => true,
      signIn: async (challenge) => ({
        state: challenge.state,
        authorizationCode: `code-${attempt}`,
        identityToken: `identity-${attempt}`,
      }),
    },
    post: async (path, body) => {
      if (path.endsWith("challenge")) {
        attempt++;
        return {
          data: {
            challenge_id: `challenge-${attempt}`,
            nonce: `nonce-${attempt}`,
            state: `state-${attempt}`,
          },
        };
      }
      submitted.push(body);
      if (attempt === 1) throw toApiError(503, { message: secret });
      return {
        data: {
          status: "authenticated",
          access_token: "session",
          user: { id: "user" },
        },
      };
    },
    toSession: () => ({ accessToken: "session" }),
  });
  await assert.rejects(service.login(), (error) => error.retryable);
  assert.equal((await service.login()).status, "authenticated");
  assert.equal(attempt, 2);
  assert.notEqual(submitted[0].challenge_id, submitted[1].challenge_id);
  assert.notEqual(
    submitted[0].authorization_code,
    submitted[1].authorization_code,
  );
});

test("signup server failure retains the draft and allows only deliberate retry", async () => {
  let feedback;
  let calls = 0;
  let signedIn = 0;
  let verificationFailures = 0;
  let reject;
  const draft = {
    email: "new@example.test",
    password: "password123",
    verificationCode: "123456",
    firstName: "New",
    lastName: "Owner",
    company: "Company",
  };
  const snapshot = { ...draft };
  const { useRegistrationSubmission } = loadWithMocks(
    filename("../hooks/auth/registration/useRegistrationSubmission.ts"),
    {
      react: {
        useState: (value) => [value, () => {}],
        useRef: (current) => ({ current }),
        useCallback: (callback) => callback,
      },
      "expo-router": { router: { replace() {} } },
      "../../useAuth": {
        useAuth: () => ({
          signIn: () => {
            signedIn++;
          },
        }),
      },
      "../../useMountedRef": { useMountedRef: () => ({ current: true }) },
    },
  );
  const hook = useRegistrationSubmission({
    draft,
    onFeedback: (value) => {
      feedback = value;
    },
    onVerificationFailure: () => {
      verificationFailures++;
    },
    service: {
      register: () => {
        calls++;
        return new Promise((_resolve, fail) => {
          reject = fail;
        });
      },
    },
  });
  const first = hook.submitRegistration();
  await hook.submitRegistration();
  reject(toApiError(500, { message: secret }));
  await first;
  assert.equal(calls, 1);
  assert.equal(feedback.error.title, "Unable to create account");
  assert.equal(feedback.message, SERVER_ERROR_MESSAGE);
  assert.deepEqual(draft, snapshot);
  assert.equal(signedIn, 0);
  assert.equal(verificationFailures, 0);
});

test("Retry-After delay reaches zero, blocks early retry and cleans up its timer", (t) => {
  let clock = 1000;
  let now = clock;
  let effect;
  let tick;
  let cleared = 0;
  let memo;
  const feedback = authErrorFeedback(toApiError(429, {}, { retryAfter: "2" }));
  t.mock.method(Date, "now", () => clock);
  t.mock.method(globalThis, "setInterval", (callback) => {
    tick = callback;
    return 123;
  });
  t.mock.method(globalThis, "clearInterval", () => {
    cleared++;
  });
  const { useAuthRetryDelay } = loadWithMocks(
    filename("../hooks/auth/useAuthRetryDelay.ts"),
    {
      react: {
        useMemo: (factory) => memo ?? (memo = factory()),
        useState: () => [
          now,
          (value) => {
            now = value;
          },
        ],
        useEffect: (callback) => {
          effect = callback;
        },
      },
    },
  );
  assert.equal(useAuthRetryDelay(feedback), 2);
  const cleanup = effect();
  clock = 2000;
  tick();
  assert.equal(useAuthRetryDelay(feedback), 1);
  clock = 3000;
  tick();
  assert.equal(useAuthRetryDelay(feedback), 0);
  cleanup();
  assert.ok(cleared >= 1);
});

test("Apple identity rejection offers a fresh attempt without exposing diagnostics", () => {
  const { authErrorFeedback } = load("../../utils/auth/authErrorFeedback.ts");
  const error = toApiError(422, {
    success: false,
    error: "apple_identity_unverified",
    message: "Apple identity could not be verified. Start again.",
    request_id: "d5881f71-28a5-499c-a731-c8fcd837d7a0",
  });
  const feedback = authErrorFeedback(error);
  assert.equal(feedback.retryable, true);
  assert.equal(
    feedback.message,
    "Apple sign-in couldn’t be verified. Please try again.",
  );
  assert.equal(feedback.requestId, "d5881f71-28a5-499c-a731-c8fcd837d7a0");
});
