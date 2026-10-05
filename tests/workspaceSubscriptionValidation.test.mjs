import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

function workspaceMutation(
  waitForSubscriptionValidation,
  updateWorkspaceSettings,
  sessionAccess,
) {
  const filename = fileURLToPath(
    new URL("../hooks/api/useWorkspaceSettings.ts", import.meta.url),
  );
  const instance = new Module(filename);
  instance.filename = filename;
  const mocks = {
    "@tanstack/react-query": {
      useQuery: () => ({}),
      useMutation: (options) => options,
      useQueryClient: () => ({}),
    },
    "../../api/workspaceSettings": { updateWorkspaceSettings },
    "../auth/useAccess": { useAccess: () => ({ can: () => true }) },
    "../useAuth": {
      useAuth: () => ({
        session: { user: { id: 1, tenant_id: "tenant-paid" } },
      }),
    },
    "../useRevenueCat": {
      useRevenueCat: () => ({ waitForSubscriptionValidation }),
    },
    "../../services/access/sessionAccess": {
      getSessionAccess: () => sessionAccess,
    },
    "../../api/errors": load("../../api/errors.ts"),
  };
  instance.require = (specifier) => {
    assert.ok(specifier in mocks, `Unexpected dependency: ${specifier}`);
    return mocks[specifier];
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
  return instance.exports.useWorkspaceSettings().mutation.mutationFn;
}

test("workspace save waits for startup entitlement validation", async () => {
  let finishValidation;
  const validation = new Promise((resolve) => {
    finishValidation = resolve;
  });
  const updates = [];
  const save = workspaceMutation(
    () => validation,
    async (changes) => {
      updates.push(changes);
    },
    { revision: 1 },
  );
  const request = save({ appName: "First Company" });
  assert.deepEqual(updates, []);
  finishValidation();
  await request;
  assert.deepEqual(updates, [{ appName: "First Company" }]);
});

test("workspace save cannot migrate to another account during startup validation", async () => {
  const sessionAccess = { revision: 1 };
  let updates = 0;
  const save = workspaceMutation(
    async () => {
      sessionAccess.revision++;
    },
    async () => {
      updates++;
    },
    sessionAccess,
  );
  await assert.rejects(save({ appName: "First Company" }), {
    code: "ACCESS_CHANGED",
  });
  assert.equal(updates, 0);
});

test("subscription validation preserves backend inactive-subscription guard", async () => {
  const { ApiError } = load("../../api/errors.ts");
  const save = workspaceMutation(
    async () => {},
    async () => {
      throw new ApiError(
        "Subscription inactive. Subscribe to resume changes.",
        403,
        "subscription_inactive",
      );
    },
    { revision: 1 },
  );
  await assert.rejects(save({ appName: "First Company" }), {
    code: "subscription_inactive",
    status: 403,
  });
});
