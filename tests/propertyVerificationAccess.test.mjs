import test from "node:test";
import assert from "node:assert/strict";
import load from "./helpers/loadTs.cjs";
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { describeRequest, assertRequestAccess, ResourceScopeIndex } = load(
  "../../services/access/requestPolicy.ts",
);

test("verification, evidence and availability deny managers even with property mutation grants", () => {
  const id = "12345678-1234-4234-8234-123456789abc";
  const manager = normalizeAccess({
    role: "MANAGER",
    permissions: ["properties.view", "properties.update", "staff.manage"],
    assigned_property_ids: [id],
  });
  const admin = normalizeAccess({ role: "ADMIN" });
  for (const [path, method] of [
    [`/properties/${id}/verification`, "GET"],
    [`/properties/${id}/verification`, "POST"],
    [`/properties/${id}/verification/record/evidence`, "POST"],
    [`/properties/${id}/verification/record/submit`, "POST"],
    [`/properties/${id}/availability`, "PATCH"],
  ]) {
    const request = describeRequest(path, method);
    assert.throws(
      () => assertRequestAccess(manager, request, new ResourceScopeIndex()),
      /permission/,
    );
    assert.doesNotThrow(() =>
      assertRequestAccess(admin, request, new ResourceScopeIndex()),
    );
  }
});
