import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { permits, canAccessProperty } = load("../../utils/auth/accessPolicy.ts");
const {
  describeRequest,
  assertRequestAccess,
  scopeResponse,
  ResourceScopeIndex,
} = load("../../services/access/requestPolicy.ts");
const { ApiError, toApiError } = load("../../api/errors.ts");
const { setSessionAccess, getSessionAccess } = load(
  "../../services/access/sessionAccess.ts",
);
const { mergeUpdatedProfile } = load("../../utils/profile/profileForm.ts");
const owner = normalizeAccess({ role: "OWNER" });
const operational = [
  "properties.viewAny",
  "properties.view",
  "properties.create",
  "properties.update",
  "properties.delete",
  "clients.create",
  "documents.viewAny",
  "bedspaces.viewAny",
  "bedspaces.update",
];
const manager = normalizeAccess({
  role: "MANAGER",
  assigned_property_ids: ["p1"],
  permissions: operational,
});

test("owner alias and unknown roles use explicit permissions", () => {
  assert.equal(owner.role, "ADMIN");
  assert.equal(permits(owner, "staff.manage"), true);
  assert.equal(
    permits(normalizeAccess({ role: "garbage" }), "properties.viewAny"),
    false,
  );
  assert.equal(permits(owner, "not.a.permission"), false);
});
test("nested ADMIN access null overrides the model permissions column", () => {
  const admin = normalizeAccess({
    role: "ADMIN",
    permissions: [],
    access: {
      role: "ADMIN",
      permissions: null,
      propertyIds: [],
      propertyPermissions: {},
    },
  });
  assert.equal(permits(admin, "staff.manage"), true);
  assert.equal(permits(admin, "billing.checkout"), true);
  assert.equal(permits(admin, "properties.viewAny"), true);
});
test("manager cannot gain owner operations through supplied grants", () => {
  const access = normalizeAccess({
    role: "MANAGER",
    permissions: [
      "staff.manage",
      "billing.checkout",
      "expenses.approve",
      "payments.delete",
      "audit.view",
      "audit.export",
    ],
  });
  for (const permission of access.permissions)
    assert.equal(permits(access, permission), false);
});
test("audit history and exports require owner permissions", () => {
  for (const path of [
    "/audit-events",
    "/audit-events/event-id",
    "/audit-events/event-id/record",
    "/audit-events/export",
  ]) {
    const request = describeRequest(path, "GET");
    assert.equal(
      request.permission,
      path.endsWith("/export") ? "audit.export" : "audit.view",
    );
    assert.doesNotThrow(() =>
      assertRequestAccess(owner, request, new ResourceScopeIndex()),
    );
    assert.throws(
      () => assertRequestAccess(manager, request, new ResourceScopeIndex()),
      ApiError,
    );
  }
});
test("deletion submission is self-service while review stays owner-only", () => {
  const managerWithoutGrants = normalizeAccess({
    role: "MANAGER",
    permissions: [],
  });
  assert.equal(permits(managerWithoutGrants, "account.requestDeletion"), true);
  assert.equal(
    permits(managerWithoutGrants, "account.reviewDeletionRequests"),
    false,
  );
  assert.equal(permits(owner, "account.reviewDeletionRequests"), true);
  assert.equal(
    describeRequest("/account/deletion-request", "POST").permission,
    "account.requestDeletion",
  );
  assert.equal(
    describeRequest("/admin/deletion-requests", "GET").permission,
    "account.reviewDeletionRequests",
  );
});
test("explicit empty and malformed grants deny rather than use defaults", () => {
  for (const permissions of [[], null, "all", {}]) {
    assert.equal(
      permits(
        normalizeAccess({ role: "ADMIN", permissions }),
        "properties.viewAny",
      ),
      false,
    );
  }
  assert.equal(
    permits(normalizeAccess({ role: "ADMIN" }), "properties.viewAny"),
    true,
  );
  for (const permissions of [undefined, null, "all", {}]) {
    assert.equal(
      permits(
        normalizeAccess({ role: "MANAGER", permissions }),
        "properties.viewAny",
      ),
      false,
    );
  }
  assert.equal(
    permits(
      normalizeAccess({
        role: "ADMIN",
        permissions: ["properties.viewAny", 7],
      }),
      "properties.viewAny",
    ),
    true,
  );
  assert.equal(
    permits(
      normalizeAccess({
        role: "MANAGER",
        permissions: ["properties.viewAny", 7],
      }),
      "properties.viewAny",
    ),
    false,
  );
});
test("unassigned or missing assignment data never grants manager property access", () => {
  for (const assigned_property_ids of [undefined, [], null, "p1"]) {
    assert.equal(
      canAccessProperty(
        normalizeAccess({ role: "MANAGER", assigned_property_ids }),
        "p1",
      ),
      false,
    );
  }
  assert.equal(canAccessProperty(manager, "p1"), true);
  assert.equal(canAccessProperty(manager, "p2"), false);
  assert.equal(canAccessProperty(owner, "p2"), true);
});
test("per-property grants can narrow global permissions", () => {
  const access = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: ["properties.view", "properties.update"],
    property_permissions: { p1: ["properties.view"] },
  });
  assert.equal(permits(access, "properties.view", "p1"), true);
  assert.equal(permits(access, "properties.update", "p1"), false);
  assert.equal(permits(access, "properties.view", "p2"), false);
});
test("method overrides and financial approvals resolve to the actual mutation", () => {
  assert.equal(
    describeRequest("/properties/p1?_method=PUT", "POST").permission,
    "properties.update",
  );
  assert.equal(
    describeRequest("/documents/d1", "POST", { _parts: [["_method", "PUT"]] })
      .permission,
    "documents.update",
  );
  assert.equal(
    describeRequest("/expenses/e1/approve", "POST").permission,
    "expenses.approve",
  );
});
test("direct links and mutations against another property fail before transport", () => {
  const index = new ResourceScopeIndex();
  assert.throws(
    () =>
      assertRequestAccess(
        manager,
        describeRequest("/properties/p2", "GET"),
        index,
      ),
    ApiError,
  );
  index.remember("leases", "l1", "p1");
  assert.throws(
    () =>
      assertRequestAccess(
        manager,
        describeRequest("/leases/l1", "PUT", { property_id: "p2" }),
        index,
      ),
    ApiError,
  );
  assert.doesNotThrow(() =>
    assertRequestAccess(
      manager,
      describeRequest("/clients", "POST", { property_ids: ["p1"] }),
      index,
    ),
  );
  assert.throws(
    () =>
      assertRequestAccess(
        manager,
        describeRequest("/clients", "POST", { property_ids: ["p1", "p2"] }),
        index,
      ),
    ApiError,
  );
  assert.throws(
    () =>
      assertRequestAccess(
        manager,
        describeRequest("/leases/unknown", "DELETE"),
        index,
      ),
    ApiError,
  );
});
test("collections filter unassigned rows before caching and suppress global totals", () => {
  const index = new ResourceScopeIndex();
  const response = scopeResponse(
    {
      data: {
        data: [{ id: "p1" }, { id: "p2" }],
        total: 99,
        current_page: 1,
        last_page: 2,
      },
    },
    manager,
    describeRequest("/properties", "GET"),
    index,
  );
  assert.deepEqual(response.data.data, [{ id: "p1" }]);
  assert.equal(response.data.total, undefined);
  assert.equal(response.data.last_page, 2);
});
test("query filters never stand in for actual row ownership", () => {
  const index = new ResourceScopeIndex();
  const response = scopeResponse(
    [
      { id: "d1" },
      { id: "d2", property_id: "p2" },
      { id: "d3", property_id: "p1" },
    ],
    manager,
    describeRequest("/documents?property_id=p1", "GET"),
    index,
  );
  assert.deepEqual(
    response.map((row) => row.id),
    ["d3"],
  );
});
test("nested room inventory inherits a verified property and records bedspace scope", () => {
  const index = new ResourceScopeIndex();
  index.remember("rooms", "r1", "p1");
  const request = describeRequest("/rooms/r1/bedspaces", "GET");
  assert.equal(request.permission, "bedspaces.viewAny");
  assertRequestAccess(manager, request, index);
  assert.deepEqual(scopeResponse([{ id: "b1" }], manager, request, index), [
    { id: "b1" },
  ]);
  assert.equal(index.find("bedspaces", "b1"), "p1");
  assert.doesNotThrow(() =>
    assertRequestAccess(
      manager,
      describeRequest("/bedspaces/b1", "PATCH"),
      index,
    ),
  );
});
test("assigned property subresources keep child rows after target access is verified", () => {
  const index = new ResourceScopeIndex();
  const request = describeRequest("/properties/p1/status-history", "GET");
  const response = {
    data: [
      { id: "history-1", fromStatus: "IDLE", toStatus: "UNDER_CONSTRUCTION" },
    ],
  };
  assert.doesNotThrow(() => assertRequestAccess(manager, request, index));
  assert.deepEqual(scopeResponse(response, manager, request, index), response);
});
test("aggregate endpoints stay closed to managers until scoped reporting exists", () => {
  for (const path of [
    "/analytics/stats",
    "/search?q=home",
    "/reports/export",
    "/account/data-export",
  ]) {
    assert.throws(
      () =>
        assertRequestAccess(
          manager,
          describeRequest(path, "GET"),
          new ResourceScopeIndex(),
        ),
      ApiError,
    );
  }
});
test("scoped search requires an explicit grant and staff APIs remain owner only", () => {
  const searcher = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: ["search.viewAny"],
  });
  assert.doesNotThrow(() =>
    assertRequestAccess(
      searcher,
      describeRequest("/search?q=home", "GET"),
      new ResourceScopeIndex(),
    ),
  );
  assert.throws(
    () =>
      assertRequestAccess(
        searcher,
        describeRequest("/staff/access-catalog", "GET"),
        new ResourceScopeIndex(),
      ),
    ApiError,
  );
});
test("scope changes and logout invalidate the session revision", () => {
  setSessionAccess({ role: "ADMIN" }, "owner-token");
  const previous = getSessionAccess();
  setSessionAccess(
    { role: "MANAGER", assigned_property_ids: [] },
    "manager-token",
  );
  assert.notEqual(getSessionAccess().revision, previous.revision);
  setSessionAccess(null);
  assert.equal(getSessionAccess().token, undefined);
  assert.equal(getSessionAccess().access.role, undefined);
});
test("manager may create a property before receiving assignments; owner staff controls stay closed", () => {
  const unassigned = normalizeAccess({
    role: "MANAGER",
    permissions: ["properties.create", "properties.viewAny"],
  });
  assert.equal(permits(unassigned, "properties.create"), true);
  assert.doesNotThrow(() =>
    assertRequestAccess(
      unassigned,
      describeRequest("/properties", "POST"),
      new ResourceScopeIndex(),
    ),
  );
  assert.doesNotThrow(() =>
    assertRequestAccess(
      unassigned,
      describeRequest("/properties", "GET"),
      new ResourceScopeIndex(),
    ),
  );
  assert.throws(
    () =>
      assertRequestAccess(
        manager,
        describeRequest("/properties/p1/managers", "POST", {
          manager_ids: ["m1"],
        }),
        new ResourceScopeIndex(),
      ),
    ApiError,
  );
  assert.throws(
    () =>
      assertRequestAccess(
        unassigned,
        describeRequest("/rooms", "POST"),
        new ResourceScopeIndex(),
      ),
    ApiError,
  );
  assert.deepEqual(
    scopeResponse(
      { data: { id: "new" } },
      unassigned,
      describeRequest("/properties", "POST"),
      new ResourceScopeIndex(),
    ),
    { data: { id: "new" } },
  );
  assert.equal(canAccessProperty(unassigned, "new"), false);
});
test("403 error retains status/code and actionable business messages", () => {
  assert.match(
    toApiError(403, { message: "Unauthorized action." }).message,
    /account owner/,
  );
  const limit = toApiError(403, {
    message: "Manager limit reached (maximum 2).",
    code: "MANAGER_LIMIT_REACHED",
  });
  assert.equal(limit.message, "Manager limit reached (maximum 2).");
  assert.equal(limit.status, 403);
  assert.equal(limit.code, "MANAGER_LIMIT_REACHED");
});
test("profile display fields cannot change role and existing grants survive sparse profile responses", () => {
  const current = { role: "MANAGER", access: manager };
  const merged = mergeUpdatedProfile(
    current,
    { name: "Updated" },
    {
      fullName: "Updated",
      companyName: "",
      phoneNumber: "",
      imageUri: "",
      jobTitle: "ADMIN",
    },
  );
  assert.equal(merged.role, "MANAGER");
  assert.deepEqual(merged.access, manager);
});
