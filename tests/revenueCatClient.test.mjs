import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

function clientWith(purchases) {
  const filename = fileURLToPath(
    new URL("../services/billing/revenueCatClient.ts", import.meta.url),
  );
  const instance = new Module(filename);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(filename);
  instance.require = (specifier) => {
    if (specifier === "react-native") return { Platform: { OS: "ios" } };
    if (specifier === "react-native-purchases")
      return { __esModule: true, default: purchases };
    if (specifier === "../../constants/revenueCat")
      return { REVENUECAT_OFFERING_ID: "default" };
    return load(specifier);
  };
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  instance._compile(outputText, filename);
  return instance.exports;
}

const info = { entitlements: { active: { professional_access: {} } } };
const defaults = {
  isConfigured: async () => true,
  getAppUserID: async () => "tenant-paid",
  getCustomerInfo: async () => info,
};

// This fixture is a public SDK key; no external requests are made.
process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY = "appl_test_fixture";

test("startup identifies active tenant before fetching fresh subscription", async () => {
  const calls = [];
  const client = clientWith({
    ...defaults,
    getAppUserID: async () => "tenant-old",
    logIn: async (tenant) => {
      calls.push(["login", tenant]);
      return { customerInfo: {} };
    },
    invalidateCustomerInfoCache: async () => calls.push(["invalidate"]),
    getCustomerInfo: async () => {
      calls.push(["info"]);
      return info;
    },
  });
  assert.equal(
    await client.identifyRevenueCatCustomer("tenant-paid", null, {
      fresh: true,
    }),
    info,
  );
  assert.deepEqual(calls, [["login", "tenant-paid"], ["invalidate"], ["info"]]);
});

test("same tenant startup refreshes stale info without restoring purchases", async () => {
  let fresh = false;
  const client = clientWith({
    ...defaults,
    invalidateCustomerInfoCache: async () => {
      fresh = true;
    },
    getCustomerInfo: async () =>
      fresh ? info : { entitlements: { active: {} } },
  });
  assert.equal(
    await client.identifyRevenueCatCustomer("tenant-paid", null, {
      fresh: true,
    }),
    info,
  );
});

test("email metadata failure preserves validated customer info", async (t) => {
  t.mock.method(console, "warn", () => {});
  const client = clientWith({
    ...defaults,
    setEmail: async () => {
      throw new Error("metadata unavailable");
    },
  });
  assert.equal(
    await client.identifyRevenueCatCustomer(
      "tenant-paid",
      "owner@example.test",
    ),
    info,
  );
});

test("missing offerings do not discard subscription snapshot", async (t) => {
  t.mock.method(console, "warn", () => {});
  const client = clientWith({
    ...defaults,
    getOfferings: async () => {
      throw new Error("products unavailable");
    },
  });
  const snapshot = await client.getRevenueCatSnapshot();
  assert.equal(snapshot.customerInfo, info);
  assert.equal(snapshot.currentOffering, null);
});

test("rapid tenant switches serialize SDK identities", async () => {
  const calls = [];
  let current = "tenant-old";
  let release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const client = clientWith({
    ...defaults,
    getAppUserID: async () => current,
    logIn: async (tenant) => {
      calls.push(tenant);
      if (tenant === "tenant-a") await barrier;
      current = tenant;
      return { customerInfo: info };
    },
  });
  const first = client.identifyRevenueCatCustomer("tenant-a");
  const second = client.identifyRevenueCatCustomer("tenant-b");
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["tenant-a"]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(calls, ["tenant-a", "tenant-b"]);
  assert.equal(current, "tenant-b");
});
