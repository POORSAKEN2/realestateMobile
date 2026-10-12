import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

function loadWithMocks(path, mocks) {
  const filename = fileURLToPath(new URL(path, import.meta.url));
  const instance = new Module(filename);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(filename);
  instance.require = (request) =>
    request in mocks
      ? mocks[request]
      : load(Module.createRequire(filename).resolve(request));
  instance._compile(
    ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText,
    filename,
  );
  return instance.exports;
}

function hooks() {
  const state = [];
  const refs = [];
  const dependencies = [];
  let cursor = 0;
  let effects = [];
  return {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useState: (initial) => {
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
      useRef: (value) => {
        const index = cursor++;
        return refs[index] ?? (refs[index] = { current: value });
      },
      useMemo: (factory) => factory(),
      useEffect: (effect, deps) => {
        const index = cursor++;
        if (
          !dependencies[index] ||
          deps.some((value, i) => !Object.is(value, dependencies[index][i]))
        )
          effects.push(effect);
        dependencies[index] = deps;
      },
    },
    render: (component) => {
      cursor = 0;
      return component();
    },
    flush: async () => {
      const pending = effects;
      effects = [];
      const cleanups = pending
        .map((effect) => effect())
        .filter((value) => typeof value === "function");
      await new Promise((resolve) => setImmediate(resolve));
      return () => cleanups.forEach((cleanup) => cleanup());
    },
  };
}

const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const appleSession = {
  accessToken: "test-session",
  authMethod: "apple",
  appleUserId: "test-apple-user",
  user: { id: "user", role: "ADMIN", onboarding_complete: true },
  onboarding: { onboarding_complete: true },
};

test("persisted Apple sessions restore across provider remounts without Apple authentication", async (t) => {
  const storage = new Map();
  const queryClient = { clear() {} };
  const intervals = new Set();
  t.mock.method(globalThis, "setInterval", (callback) => {
    intervals.add(callback);
    return callback;
  });
  t.mock.method(globalThis, "clearInterval", (timer) =>
    intervals.delete(timer),
  );
  const access = load("../../services/access/sessionAccess.ts");
  access.setSessionAccess(null);
  const mount = () => {
    const runtime = hooks();
    const { AuthProvider } = loadWithMocks("../context/AuthContext.tsx", {
      react: runtime.react,
      "react/jsx-runtime": jsx,
      "expo-secure-store": {
        isAvailableAsync: async () => true,
        getItemAsync: async (key) => storage.get(key) ?? null,
        setItemAsync: async (key, value) => storage.set(key, value),
        deleteItemAsync: async (key) => storage.delete(key),
      },
      "@tanstack/react-query": { useQueryClient: () => queryClient },
      "react-native": {
        AppState: {
          currentState: "active",
          addEventListener: () => ({ remove() {} }),
        },
      },
      "../api/user": { fetchCurrentUser: async () => appleSession.user },
    });
    return {
      runtime,
      render: () =>
        runtime.render(() => AuthProvider({ children: null })).props.value,
    };
  };
  const first = mount();
  first.render();
  const unmount = await first.runtime.flush();
  first.render().signIn(appleSession);
  first.render();
  const stopRefresh = await first.runtime.flush();
  const saved = JSON.parse(storage.get("realestate.auth.session"));
  assert.equal(saved.authMethod, "apple");
  assert.equal(saved.accessToken, appleSession.accessToken);
  assert.equal(saved.appleUserId, appleSession.appleUserId);
  unmount();
  stopRefresh();
  access.setSessionAccess(null);
  const second = mount();
  second.render();
  const stopRestore = await second.runtime.flush();
  const restored = second.render();
  const stopRestoredRefresh = await second.runtime.flush();
  assert.equal(restored.isAuthenticated, true);
  assert.equal(restored.hasCompletedOnboarding, true);
  assert.equal(restored.session.accessToken, appleSession.accessToken);
  assert.equal(access.getSessionAccess().token, appleSession.accessToken);
  assert.equal(storage.has("realestate.auth.session"), true);
  stopRestore();
  stopRestoredRefresh();
  access.setSessionAccess(null);
});

test("Apple login redirects only after AuthContext commits the matching session", async () => {
  const runtime = hooks();
  let auth = { signIn: () => {}, session: null, isAuthenticated: false };
  let authenticated;
  const redirects = [];
  const ui = Object.fromEntries(
    [
      "ActivityIndicator",
      "KeyboardAvoidingView",
      "Pressable",
      "ScrollView",
      "Text",
      "TextInput",
      "View",
    ].map((name) => [name, name]),
  );
  const { default: LoginScreen } = loadWithMocks("../app/(auth)/login.tsx", {
    react: runtime.react,
    "react/jsx-runtime": jsx,
    "@expo/vector-icons": { Feather: "icon" },
    "expo-router": {
      Link: "link",
      Stack: { Screen: "screen" },
      router: { replace: (route) => redirects.push(route) },
      useLocalSearchParams: () => ({}),
    },
    "expo-status-bar": { StatusBar: "status" },
    "react-native": { ...ui, Platform: { OS: "ios" }, Alert: { alert() {} } },
    "react-native-safe-area-context": { SafeAreaView: "safe-area" },
    "../../assets/branding/svg/brand-combination-vertical-white.svg": {
      __esModule: true,
      default: "brand",
    },
    "../../components/auth/SocialLoginSection": {
      SocialLoginSection: "social",
    },
    "../../components/auth/AppleAccountModal": { AppleAccountModal: "modal" },
    "../../hooks/auth/useAppleLogin": {
      useAppleLogin: (callback) => {
        authenticated = callback;
        return { busy: false, account: null };
      },
    },
    "../../hooks/useAuth": { useAuth: () => auth },
    "../../hooks/useLogin": {
      useLogin: () => ({ email: "", password: "", isLoading: false }),
    },
    "../../components/legal/LegalLink": { LegalLink: "legal" },
  });
  runtime.render(LoginScreen);
  await runtime.flush();
  authenticated(appleSession);
  runtime.render(LoginScreen);
  await runtime.flush();
  assert.deepEqual(redirects, []);
  auth = {
    ...auth,
    isAuthenticated: true,
    session: { accessToken: "older-session" },
  };
  runtime.render(LoginScreen);
  await runtime.flush();
  assert.deepEqual(redirects, []);
  auth = { ...auth, session: appleSession };
  runtime.render(LoginScreen);
  await runtime.flush();
  assert.deepEqual(redirects, ["/"]);
  runtime.render(LoginScreen);
  await runtime.flush();
  assert.deepEqual(redirects, ["/"]);
});
