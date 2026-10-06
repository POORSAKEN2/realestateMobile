import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

const paid = {
  tier: "professional",
  effective_tier: "professional",
  access_mode: "active",
  entitlement_source: "purchase",
};
const trial = { ...paid, entitlement_source: "trial" };
const info = {
  originalAppUserId: "tenant-one",
  entitlements: {
    active: {
      professional_access: { productIdentifier: "professional_monthly" },
    },
  },
};

function mountProvider(
  t,
  {
    role = "ADMIN",
    reconcile = async () => paid,
    identify = async () => info,
  } = {},
) {
  const filename = fileURLToPath(
    new URL("../context/RevenueCatContext.tsx", import.meta.url),
  );
  const instance = new Module(filename);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(filename);
  const effects = [];
  const calls = { reconcile: 0, offerings: 0, store: [], cached: trial };
  let timer;
  let timerCleared = false;
  let stateListener;
  let context;
  const appState = {
    currentState: "active",
    addEventListener: (_event, listener) => {
      stateListener = listener;
      return { remove() {} };
    },
  };
  t.mock.method(globalThis, "setInterval", (callback, milliseconds) => {
    assert.equal(milliseconds, 60_000);
    timer = callback;
    return 1;
  });
  t.mock.method(globalThis, "clearInterval", () => {
    timerCleared = true;
  });
  const synchronizers = load(
    "../../services/billing/billingEntitlementSync.ts",
  );
  const mocks = {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useState: (initial) => [
        typeof initial === "function" ? initial() : initial,
        () => {},
      ],
      useRef: (current) => ({ current }),
      useMemo: (factory) => factory(),
      useCallback: (callback) => callback,
      useEffect: (effect) => effects.push(effect),
    },
    "react/jsx-runtime": {
      jsx: (_type, props) => {
        context = props.value;
        return props;
      },
    },
    "react-native": { AppState: appState },
    "react-native-purchases": {
      __esModule: true,
      default: {
        addCustomerInfoUpdateListener() {},
        removeCustomerInfoUpdateListener() {},
      },
    },
    "@tanstack/react-query": {
      useQueryClient: () => ({
        cancelQueries: async () => {},
        setQueryData: (_key, value) => {
          calls.cached = value;
        },
        getQueryData: () => calls.cached,
        invalidateQueries: async () => {},
      }),
    },
    "../hooks/useAuth": {
      useAuth: () => ({
        isLoading: false,
        session: {
          accessToken: "test-token",
          user: { role, tenant_id: "tenant-one" },
        },
      }),
    },
    "../hooks/api/useBillingEntitlement": {
      BILLING_ENTITLEMENT_QUERY_KEY: ["billingEntitlement"],
      billingEntitlementQueryKey: (tenant) => ["billingEntitlement", tenant],
      useBillingEntitlement: () => ({ data: calls.cached }),
    },
    "../api/billing": {
      reconcileBillingEntitlement: async () => {
        calls.reconcile++;
        return reconcile();
      },
    },
    "../services/billing/billingEntitlementSync": {
      createBillingEntitlementSynchronizer: (dependencies) =>
        synchronizers.createBillingEntitlementSynchronizer({
          ...dependencies,
          retryOptions: { delaysMs: [0] },
        }),
    },
    "../services/billing/revenueCatClient": {
      configureRevenueCat: async () => {},
      identifyRevenueCatCustomer: async (...args) => {
        calls.store.push(args);
        return identify();
      },
      getCurrentRevenueCatOffering: async () => {
        calls.offerings++;
        return null;
      },
      toRevenueCatClientError: (error) => error,
    },
    "../services/billing/revenueCatUi": {},
  };
  instance.require = (specifier) =>
    specifier in mocks
      ? mocks[specifier]
      : load(
          fileURLToPath(
            new URL(specifier + ".ts", new URL("../context/", import.meta.url)),
          ),
        );
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
  instance.exports.RevenueCatProvider({ children: null });
  const cleanups = effects.map((effect) => effect());
  const dispose = () => cleanups.forEach((cleanup) => cleanup?.());
  t.after(dispose);
  return {
    calls,
    tick: () => timer(),
    settled: () => context.waitForSubscriptionValidation(),
    setState: (state) => {
      appState.currentState = state;
      stateListener(state);
    },
    dispose,
    timerCleared: () => timerCleared,
  };
}

test("periodic store checks recover delayed access without manual refresh or offering reload", async (t) => {
  let attempts = 0;
  const provider = mountProvider(t, {
    reconcile: async () => (++attempts === 1 ? trial : paid),
  });
  t.mock.method(console, "warn", () => {});
  await provider.settled();
  assert.equal(provider.calls.cached.entitlement_source, "trial");
  provider.tick();
  await provider.settled();
  assert.equal(provider.calls.cached.entitlement_source, "purchase");
  assert.equal(provider.calls.reconcile, 2);
  assert.equal(provider.calls.offerings, 1);
  assert.deepEqual(provider.calls.store[1], [
    "tenant-one",
    undefined,
    { fresh: true },
  ]);
  provider.tick();
  await provider.settled();
  assert.equal(provider.calls.reconcile, 2);
});

test("background pauses store checks; app return validates access again", async (t) => {
  const provider = mountProvider(t);
  await provider.settled();
  provider.setState("background");
  provider.tick();
  assert.equal(provider.calls.store.length, 1);
  provider.setState("active");
  await provider.settled();
  assert.equal(provider.calls.store.length, 2);
  assert.equal(provider.calls.reconcile, 2);
});

test("manager monitoring never invokes administrator reconciliation", async (t) => {
  const provider = mountProvider(t, { role: "MANAGER" });
  await provider.settled();
  provider.tick();
  await provider.settled();
  assert.equal(provider.calls.store.length, 2);
  assert.equal(provider.calls.reconcile, 0);
});

test("unmount discards a pending store refresh and removes periodic timer", async (t) => {
  let finish;
  const provider = mountProvider(t, {
    identify: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await Promise.resolve();
  await Promise.resolve();
  provider.dispose();
  finish(info);
  await provider.settled();
  assert.equal(provider.calls.reconcile, 0);
  assert.equal(provider.timerCleared(), true);
});
