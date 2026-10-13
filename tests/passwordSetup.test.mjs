import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import load from "./helpers/loadTs.cjs";
import loadWithMocks from "./helpers/loadWithMocks.cjs";
const file = (path) => fileURLToPath(new URL(path, import.meta.url));
const { validatePasswordSetup } = load("../../utils/settings/passwordSetup.ts");

function setup() {
  const state = [],
    refs = [],
    deps = [],
    cleanups = [];
  let cursor = 0,
    effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (value) => {
          state[index] =
            typeof value === "function" ? value(state[index]) : value;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      return refs[index] ?? (refs[index] = { current: value });
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (
        !deps[index] ||
        dependencies.some((value, i) => !Object.is(value, deps[index][i]))
      ) {
        deps[index] = dependencies;
        effects.push(() => {
          cleanups[index]?.();
          cleanups[index] = effect();
        });
      }
    },
  };
  let session = {
    accessToken: "current-session",
    authMethod: "apple",
    appleUserId: "apple-subject",
    user: { id: "member", has_password: false, role: "MANAGER" },
  };
  let revision = 1,
    native = async () => "fresh-proof",
    save = async () => ({ id: "member", has_password: true }),
    available = true;
  const mounted = { current: true },
    calls = [],
    persisted = [];
  const { usePasswordSetup } = loadWithMocks(
    file("../hooks/settings/usePasswordSetup.ts"),
    {
      react,
      "../useAuth": {
        useAuth: () => ({
          session,
          signInPersisted: async (value) => {
            persisted.push(value);
            session = value;
          },
        }),
      },
      "../useMountedRef": { useMountedRef: () => mounted },
      "../../services/access/sessionAccess": {
        getSessionAccess: () => ({ revision }),
      },
      "../../services/apple/appleAuthentication": {
        isAppleLoginAvailable: async () => available,
        isAppleCancellation: (error) =>
          ["ERR_REQUEST_CANCELED", "ERR_CANCELED"].includes(error?.code),
        reauthenticateApple: async (...args) => {
          calls.push(["apple", ...args]);
          return native(...args);
        },
      },
      "../../api/passwordSetup": {
        setFirstPassword: async (...args) => {
          calls.push(["save", ...args]);
          return save(...args);
        },
      },
    },
  );
  const render = () => {
    cursor = 0;
    return usePasswordSetup();
  };
  const flush = async () => {
    const pending = effects;
    effects = [];
    pending.forEach((effect) => effect());
    await new Promise((resolve) => setImmediate(resolve));
  };
  return {
    render,
    flush,
    calls,
    persisted,
    setNative: (value) => {
      native = value;
    },
    setSave: (value) => {
      save = value;
    },
    unsupported: () => {
      available = false;
    },
    logout: () => {
      session = null;
      revision++;
    },
    dispose: () => {
      mounted.current = false;
      cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}
async function ready(s) {
  s.render();
  await s.flush();
  s.render().update("next", "new-password123");
  s.render().update("confirm", "new-password123");
}

test("password setup validates only new and matching passwords", () => {
  assert.deepEqual(
    validatePasswordSetup({
      next: "new-password123",
      confirm: "new-password123",
    }),
    {},
  );
  assert.equal(
    Object.keys(validatePasswordSetup({ next: "", confirm: "" })).length,
    2,
  );
  assert.match(
    validatePasswordSetup({ next: "short", confirm: "short" }).next,
    /8/,
  );
  assert.match(
    validatePasswordSetup({ next: "new-password123", confirm: "other" })
      .confirm,
    /match/,
  );
  assert.match(
    validatePasswordSetup({ next: "a".repeat(1025), confirm: "a".repeat(1025) })
      .next,
    /1024/,
  );
});

test("setup verifies Apple before mutation and persists the existing session", async () => {
  const s = setup();
  await ready(s);
  assert.equal(await s.render().submit(), true);
  assert.deepEqual(
    s.calls.map((call) => call[0]),
    ["apple", "save"],
  );
  assert.equal(s.calls[0][1], "set_password");
  assert.equal(s.calls[1][3], "fresh-proof");
  assert.equal(s.persisted[0].accessToken, "current-session");
  assert.equal(s.persisted[0].authMethod, "apple");
  assert.equal(s.persisted[0].appleUserId, "apple-subject");
  assert.equal(s.persisted[0].user.has_password, true);
  assert.equal(s.persisted[0].user.role, "MANAGER");
  assert.equal(JSON.stringify(s.persisted).includes("new-password123"), false);
  assert.equal(JSON.stringify(s.persisted).includes("fresh-proof"), false);
  assert.equal(s.render().hasChanges, false);
});

test("cancellation is quiet and service failure keeps the draft for a fresh retry", async () => {
  const s = setup();
  await ready(s);
  s.setNative(async () => {
    throw { code: "ERR_REQUEST_CANCELED" };
  });
  assert.equal(await s.render().submit(), false);
  assert.equal(s.render().error, "");
  assert.equal(s.calls.filter((call) => call[0] === "save").length, 0);
  let proofs = 0;
  s.setNative(async () => `proof-${++proofs}`);
  s.setSave(async () => {
    throw new Error("SQLSTATE secret debug");
  });
  assert.equal(await s.render().submit(), false);
  assert.equal(s.render().values.next, "new-password123");
  assert.equal(s.render().error.includes("SQLSTATE"), false);
  s.setSave(async () => ({ has_password: true }));
  assert.equal(await s.render().submit(), true);
  assert.deepEqual(
    s.calls.filter((call) => call[0] === "save").map((call) => call[3]),
    ["proof-1", "proof-2"],
  );
});

test("overlapping submissions and edits stay locked during verification", async () => {
  const s = setup();
  await ready(s);
  let release;
  s.setNative(
    async () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = s.render().submit();
  assert.equal(s.render().saving, true);
  assert.equal(await s.render().submit(), false);
  s.render().update("next", "changed-password");
  assert.equal(s.render().values.next, "new-password123");
  release("fresh-proof");
  assert.equal(await first, true);
  assert.equal(s.calls.filter((call) => call[0] === "apple").length, 1);
});

test("logout or unmount clears draft and prevents stale session mutation", async () => {
  for (const action of ["logout", "dispose"]) {
    const s = setup();
    await ready(s);
    let release;
    s.setNative(
      async () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const pending = s.render().submit();
    s[action]();
    s.render();
    await s.flush();
    release("fresh-proof");
    assert.equal(await pending, false);
    assert.equal(s.persisted.length, 0);
    assert.equal(s.calls.filter((call) => call[0] === "save").length, 0);
    if (action === "logout") assert.equal(s.render().hasChanges, false);
  }
});

test("unsupported platforms cannot request Apple proof or save", async () => {
  const s = setup();
  s.unsupported();
  await ready(s);
  assert.equal(s.render().available, false);
  assert.equal(s.render().canSubmit, false);
  assert.equal(await s.render().submit(), false);
  assert.equal(s.calls.length, 0);
});

const jsx = (type, props) => ({ type, props });
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat().flatMap(nodes)];
}
test("passwordless Security action stays inside authenticated Settings", () => {
  const routes = [];
  const { SettingsPasswordCard } = loadWithMocks(
    file("../components/settings/SettingsPasswordCard.tsx"),
    {
      react: { useState: (value) => [value, () => {}] },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { Text: "text", View: "view" },
      "../ui/fields/PasswordField": { PasswordField: "field" },
      "../../hooks/settings/usePasswordChange": {
        usePasswordChange: () => ({}),
      },
      "../ui/forms/FormSection": { FormSection: "section" },
      "../ui/buttons/Button": { Button: "button" },
      "../../hooks/useAuth": {
        useAuth: () => ({ session: { user: { has_password: false } } }),
      },
      "expo-router": { router: { push: (route) => routes.push(route) } },
    },
  );
  nodes(SettingsPasswordCard())
    .find((node) => node.props.title === "Set password")
    .props.onPress();
  assert.deepEqual(routes, ["/(secondary)/settings/password"]);
});

test("shared password field supports autofill, visibility and disabled controls", () => {
  let visible = false,
    focused = false,
    cursor = 0;
  const { PasswordField } = loadWithMocks(
    file("../components/ui/fields/PasswordField.tsx"),
    {
      react: {
        useState: () =>
          cursor++ === 0
            ? [
                visible,
                (value) => {
                  visible =
                    typeof value === "function" ? value(visible) : value;
                },
              ]
            : [
                focused,
                (value) => {
                  focused = value;
                },
              ],
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { TouchableOpacity: "button" },
      "@expo/vector-icons": { Ionicons: "icon" },
      "./BaseField": { BaseField: "field" },
    },
  );
  const props = {
    label: "New password",
    value: "",
    onChangeText() {},
    disabled: false,
    textContentType: "newPassword",
  };
  const render = (extra) => {
    cursor = 0;
    return PasswordField({ ...props, ...extra });
  };
  let tree = render();
  assert.equal(tree.props.autoComplete, "new-password");
  assert.equal(tree.props.autoCapitalize, "none");
  assert.equal(tree.props.secureTextEntry, true);
  tree.props.trailing.props.onPress();
  assert.equal(render().props.secureTextEntry, false);
  assert.match(render().props.trailing.props.accessibilityLabel, /^Hide/);
  tree.props.onFocus();
  assert.equal(render().props.focused, true);
  tree = render({ disabled: true });
  assert.equal(tree.props.editable, false);
  assert.equal(tree.props.trailing.props.accessibilityState.disabled, true);
});

test("setup API sends only password fields and proof, and validates returned user", async () => {
  const calls = [];
  let response = { data: { id: "member", has_password: true } };
  const { setFirstPassword } = loadWithMocks(file("../api/passwordSetup.ts"), {
    "./client": {
      apiClient: {
        post: async (...args) => {
          calls.push(args);
          return response;
        },
      },
    },
    "./user": { normalizeUser: (user) => ({ ...user, normalized: true }) },
  });
  const signal = new AbortController().signal;
  const user = await setFirstPassword(
    "new-password123",
    "new-password123",
    "proof",
    signal,
  );
  assert.equal(user.has_password, true);
  assert.equal(user.normalized, true);
  assert.deepEqual(calls[0], [
    "/user/set-password",
    {
      password: "new-password123",
      password_confirmation: "new-password123",
      apple_reauth_token: "proof",
    },
    { signal },
  ]);
  response = { data: { has_password: false } };
  await assert.rejects(
    setFirstPassword("new-password123", "new-password123", "proof", signal),
    /invalid result/,
  );
});
