import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import loadWithMocks from "./helpers/loadWithMocks.cjs";
import load from "./helpers/loadTs.cjs";

const file = (path) => fileURLToPath(new URL(path, import.meta.url));
const jsx = (type, props) => ({ type, props });
function hooks() {
  const state = [],
    refs = [],
    effects = [],
    dependencies = [];
  let cursor = 0;
  return {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state))
          state[index] = typeof initial === "function" ? initial() : initial;
        return [
          state[index],
          (value) => {
            state[index] =
              typeof value === "function" ? value(state[index]) : value;
          },
        ];
      },
      useRef(initial) {
        const index = cursor++;
        return refs[index] ?? (refs[index] = { current: initial });
      },
      useMemo: (factory) => factory(),
      useEffect(effect, deps) {
        const index = cursor++;
        if (
          !dependencies[index] ||
          deps.some((dep, i) => dep !== dependencies[index][i])
        )
          effects.push(effect);
        dependencies[index] = deps;
      },
    },
    render(callback) {
      cursor = 0;
      return callback();
    },
    flush() {
      return effects.splice(0).map((effect) => effect());
    },
  };
}

test("keyboard events alone toggle scrolling state and subscriptions are cleaned up", () => {
  for (const platform of ["ios", "android"]) {
    const runtime = hooks(),
      listeners = new Map();
    let removed = 0;
    const { useLoginKeyboard } = loadWithMocks(
      file("../hooks/auth/useLoginKeyboard.ts"),
      {
        react: runtime.react,
        "react-native": {
          Platform: { OS: platform },
          Keyboard: {
            isVisible: () => false,
            addListener(name, listener) {
              listeners.set(name, listener);
              return {
                remove() {
                  removed++;
                },
              };
            },
          },
        },
      },
    );
    assert.equal(runtime.render(useLoginKeyboard), false);
    const cleanup = runtime.flush()[0];
    listeners.get(
      platform === "ios" ? "keyboardWillShow" : "keyboardDidShow",
    )();
    assert.equal(runtime.render(useLoginKeyboard), true);
    listeners.get(
      platform === "ios" ? "keyboardWillHide" : "keyboardDidHide",
    )();
    assert.equal(runtime.render(useLoginKeyboard), false);
    cleanup();
    assert.equal(removed, 2);
  }
});

test("profile prompt persists acknowledgement before navigation and retains notice on storage failure", async () => {
  for (const openProfile of [true, false]) {
    const runtime = hooks(),
      events = [];
    let resolve,
      fails = false;
    let session = { accessToken: "session", profileSetupNoticePending: true };
    const { ProfileSetupPrompt } = loadWithMocks(
      file("../components/auth/ProfileSetupPrompt.tsx"),
      {
        react: runtime.react,
        "react/jsx-runtime": { jsx, jsxs: jsx },
        "react-native": { Text: "text", View: "view" },
        "expo-router": {
          router: {
            replace(path) {
              events.push(path);
            },
          },
        },
        "./AuthDialog": { AuthDialog: "dialog" },
        "../ui/buttons/Button": { Button: "button" },
        "../../hooks/useAuth": {
          useAuth: () => ({
            session,
            isAuthenticated: true,
            isLoading: false,
            async signInPersisted(next) {
              if (fails) throw new Error("Storage failed");
              await new Promise((done) => {
                resolve = done;
              });
              session = next;
              events.push("stored");
            },
          }),
        },
      },
    );
    const render = () => runtime.render(ProfileSetupPrompt);
    const buttons = (tree) =>
      tree.props.children.props.children
        .at(-1)
        .props.children.map((wrapper) => wrapper.props.children);
    fails = true;
    buttons(render())[openProfile ? 1 : 0].props.onPress();
    await new Promise((done) => setImmediate(done));
    assert.equal(session.profileSetupNoticePending, true);
    assert.deepEqual(events, []);
    assert.ok(
      render().props.children.props.children.some(
        (child) => child?.props?.accessibilityRole === "alert",
      ),
    );
    fails = false;
    buttons(render())[openProfile ? 1 : 0].props.onPress();
    assert.deepEqual(events, []);
    resolve();
    await new Promise((done) => setImmediate(done));
    assert.deepEqual(events, [
      "stored",
      openProfile ? "/(secondary)/profile" : "/(tabs)/dashboard",
    ]);
    assert.equal(render(), null);
  }
});

test("Apple signup metadata creates a pending profile notice without changing existing session normalization", () => {
  const { sessionFromAuthResponse } = loadWithMocks(
    file("../utils/auth/authSession.ts"),
    {
      "../../api/user": { normalizeUser: (user) => user },
    },
  );
  const data = {
    access_token: "session",
    user: { id: "user", role: "ADMIN" },
    auth_method: "apple",
  };
  assert.equal(
    sessionFromAuthResponse({ data: { ...data, account_created: true } })
      .profileSetupNoticePending,
    true,
  );
  assert.equal(
    sessionFromAuthResponse({ data }).profileSetupNoticePending,
    undefined,
  );
});

test("missing legal URLs block automatic signup while preserving linked Apple login", async () => {
  let result = { status: "authenticated", session: { accessToken: "session" } };
  let intent;
  const { loginWithApple } = loadWithMocks(
    file("../services/apple/appleAuthentication.ts"),
    {
      "../../api/client": { apiClient: {} },
      "../../utils/auth/authSession": { sessionFromAuthResponse() {} },
      "./nativeApple": { nativeApple: {} },
      "../../constants/legal": {
        LEGAL_DOCUMENT_URLS: { terms: null, privacy: null },
      },
      "./appleAuthenticationCore": {
        createAppleAuthentication: () => ({
          async login(_signal, value) {
            intent = value;
            return result;
          },
        }),
      },
    },
  );
  assert.equal((await loginWithApple()).session.accessToken, "session");
  assert.deepEqual(intent, { autoRegister: false, confirmation: false });
  result = {
    status: "account_required",
    account: { reason: "setup_required", can_register: true },
  };
  await assert.rejects(loginWithApple(), /Account creation is disabled/);
  result = {
    status: "account_required",
    account: { reason: "existing_account" },
  };
  assert.equal((await loginWithApple()).status, "account_required");
});

test("persisted sign-in waits for storage and cannot revive a session disposed during the write", async () => {
  const runtime = hooks();
  const access = load("../../services/access/sessionAccess.ts");
  access.setSessionAccess(null);
  const storage = new Map();
  let release,
    fail = false;
  const { AuthProvider } = loadWithMocks(file("../context/AuthContext.tsx"), {
    react: {
      ...runtime.react,
      createContext: () => ({ Provider: "provider" }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "expo-secure-store": {
      isAvailableAsync: async () => true,
      getItemAsync: async (key) => storage.get(key) ?? null,
      async setItemAsync(key, value) {
        if (fail) throw new Error("Storage failed");
        if (key === "realestate.auth.session")
          await new Promise((done) => {
            release = done;
          });
        storage.set(key, value);
      },
      deleteItemAsync: async (key) => storage.delete(key),
    },
    "@tanstack/react-query": { useQueryClient: () => ({ clear() {} }) },
    "react-native": { AppState: { addEventListener: () => ({ remove() {} }) } },
    "../api/user": { fetchCurrentUser: async () => ({}) },
  });
  const render = () =>
    runtime.render(() => AuthProvider({ children: null })).props.value;
  const session = {
    accessToken: "new-session",
    profileSetupNoticePending: true,
    user: { id: "user" },
  };
  render();
  runtime.flush();
  await new Promise((done) => setImmediate(done));
  fail = true;
  await assert.rejects(render().signInPersisted(session), /Storage failed/);
  assert.equal(render().isAuthenticated, false);
  fail = false;
  const signingIn = render().signInPersisted(session);
  await new Promise((done) => setImmediate(done));
  assert.equal(render().isAuthenticated, false);
  render().signOut();
  release();
  await assert.rejects(signingIn, /session changed/);
  assert.equal(render().isAuthenticated, false);
  assert.equal(storage.has("realestate.auth.session"), false);
  access.setSessionAccess(null);
});

test("Apple linking locks overlapping requests, expires proofs, and clears credentials on cancellation", async (t) => {
  const runtime = hooks();
  const mounted = { current: true };
  let timer;
  t.mock.method(globalThis, "setTimeout", (callback) => {
    timer = callback;
    return 1;
  });
  t.mock.method(globalThis, "clearTimeout", () => {});
  let requests = 0,
    release,
    cancelled = false;
  const pending = {
    status: "account_required",
    account: { pending_token: "proof", expires_in_seconds: 600 },
  };
  const { useAppleLogin } = loadWithMocks(
    file("../hooks/auth/useAppleLogin.ts"),
    {
      react: runtime.react,
      "../useMountedRef": { useMountedRef: () => mounted },
      "./useAuthRetryDelay": { useAuthRetryDelay: () => 0 },
      "../../services/apple/appleAuthentication": {
        isAppleLoginAvailable: async () => true,
        loginWithApple: async () => {
          if (cancelled) throw { code: "ERR_REQUEST_CANCELED" };
          return pending;
        },
        isAppleCancellation: (error) => error?.code === "ERR_REQUEST_CANCELED",
        async requestAppleLinkCode() {
          requests++;
          await new Promise((done) => {
            release = done;
          });
          return {
            message: "Code requested",
            cooldown_seconds: 30,
            expires_in_seconds: 600,
          };
        },
        verifyAppleLinkCode: async () => {
          throw new Error("Apple verification expired. Start again.");
        },
      },
    },
  );
  const render = () => runtime.render(() => useAppleLogin(() => {}));
  await render().start();
  assert.equal(render().account.pending_token, "proof");
  runtime.flush();
  const sending = render().requestCode("existing@example.test");
  await render().requestCode("existing@example.test");
  assert.equal(requests, 1);
  release();
  await sending;
  assert.equal(render().linkCode.email, "existing@example.test");
  await render().verifyCode("existing@example.test", "123456");
  assert.equal(render().account, null);
  assert.equal(render().linkCode, null);
  assert.equal(render().error.retryable, true);
  await render().start();
  assert.equal(render().account.pending_token, "proof");
  runtime.flush();
  timer();
  assert.equal(render().account, null);
  cancelled = true;
  await render().start();
  assert.equal(render().error, null);
  assert.equal(render().busy, false);
});
