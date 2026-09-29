import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const {
  describeRequest,
  assertRequestAccess,
  scopeResponse,
  ResourceScopeIndex,
} = load("../../services/access/requestPolicy.ts");
const manager = normalizeAccess({
  role: "MANAGER",
  assigned_property_ids: ["p1"],
  permissions: ["payments.viewAny", "payments.update"],
});

test("overview requires collection permission and explicitly scoped server totals", () => {
  const request = describeRequest("/payments/overview", "GET");
  const index = new ResourceScopeIndex();
  assert.equal(request.permission, "payments.viewAny");
  assert.equal(request.collection, true);
  assertRequestAccess(manager, request, index);
  const response = {
    data: {
      outstanding: { count: 30, amount: 9000 },
      scope: { kind: "accessible_properties", propertyIds: ["p1"] },
    },
  };
  assert.deepEqual(scopeResponse(response, manager, request, index), response);
  for (const scope of [
    undefined,
    { kind: "tenant", propertyIds: ["p1"] },
    { kind: "accessible_properties", propertyIds: ["p2"] },
    { kind: "accessible_properties", propertyIds: [1] },
  ]) {
    assert.throws(() =>
      scopeResponse({ data: { scope } }, manager, request, index),
    );
  }
  const denied = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: [],
  });
  assert.throws(() => assertRequestAccess(denied, request, index));
});

test("payment pages remember charge ownership; collection requires update and assigned property", () => {
  const index = new ResourceScopeIndex();
  const response = scopeResponse(
    {
      data: [
        { id: "charge", propertyId: "p1" },
        { id: "hidden", propertyId: "p2" },
      ],
      meta: { current_page: 1, last_page: 2, total: 100 },
    },
    manager,
    describeRequest("/payments?bucket=overdue", "GET"),
    index,
  );
  assert.deepEqual(
    response.data.map((item) => item.id),
    ["charge"],
  );
  assert.deepEqual(response.meta, { current_page: 1, last_page: 2 });
  const collect = describeRequest("/payments/charge/collect", "POST", {
    paid_date: "2026-09-29",
  });
  assert.equal(collect.permission, "payments.update");
  assertRequestAccess(manager, collect, index);
  assert.throws(() =>
    assertRequestAccess(
      manager,
      describeRequest("/payments/hidden/collect", "POST"),
      index,
    ),
  );
  assert.throws(() =>
    assertRequestAccess(
      normalizeAccess({
        role: "MANAGER",
        assigned_property_ids: ["p1"],
        permissions: ["payments.viewAny"],
      }),
      collect,
      index,
    ),
  );
  assert.deepEqual(
    scopeResponse(
      { data: { id: "charge", propertyId: "p1", status: "Paid" } },
      manager,
      collect,
      index,
    ).data.status,
    "Paid",
  );
});

test("ledger collection learns only charges linked to the verified lease", () => {
  const access = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: ["leases.view", "payments.viewAny", "payments.update"],
  });
  const index = new ResourceScopeIndex();
  index.remember("leases", "lease", "p1");
  const request = describeRequest("/leases/lease/ledger", "GET");
  assertRequestAccess(access, request, index);
  scopeResponse(
    {
      data: {
        total_outstanding: 100,
        payments: [
          { id: "charge", lease_id: "lease", propertyId: "p1" },
          { id: "foreign", lease_id: "other", propertyId: "p2" },
        ],
      },
    },
    access,
    request,
    index,
  );
  assert.equal(index.find("payments", "charge"), "p1");
  assert.equal(index.find("payments", "foreign"), undefined);
  assertRequestAccess(
    access,
    describeRequest("/payments/charge/collect", "POST"),
    index,
  );
});
