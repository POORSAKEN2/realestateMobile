import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";
const { createStaffService, canAddManager } = load(
  "../../services/staff/staffService.ts",
);
const {
  createHttpStaffGateway,
  normalizePermissionCatalog,
  normalizeStaffRoster,
} = load("../../services/staff/httpStaffGateway.ts");
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { staffApiContract } = load("../../api/staffContract.ts");
const { resolveManagerEditorPermissions } = load(
  "../../services/staff/managerPermissionDefaults.ts",
);
const owner = normalizeAccess({ role: "ADMIN" });
const capacity = {
  limit: 5,
  accountsUsed: 2,
  invitationsReserved: 1,
  remaining: 2,
  accessMode: "active",
};
const manager = {
  id: "m1",
  name: "Manager",
  email: "manager@example.test",
  role: "MANAGER",
  status: "active",
  kind: "account",
  propertyIds: [],
  permissions: [],
};
const invitation = {
  ...manager,
  id: "i1",
  status: "pending",
  kind: "invitation",
  deliveryStatus: "queued",
};
const details = {
  name: "Manager",
  email: "manager@example.test",
  propertyIds: [],
  permissions: [],
};
test("new invitation defaults use only catalog-approved core viewing grants", () => {
  const catalog = [
    {
      label: "Properties",
      options: [
        { label: "View", grants: ["properties.viewAny", "properties.view"] },
        { label: "Add", grants: ["properties.create"] },
        { label: "Delete", grants: ["properties.delete"] },
      ],
    },
    {
      label: "Clients",
      options: [{ label: "View", grants: ["clients.viewAny", "clients.view"] }],
    },
    {
      label: "Billing",
      options: [
        { label: "View Entitlement", grants: ["billing.viewEntitlement"] },
      ],
    },
    {
      label: "Notifications",
      options: [{ label: "View", grants: ["notifications.viewAny"] }],
    },
  ];
  assert.deepEqual(resolveManagerEditorPermissions(catalog), [
    "properties.viewAny",
    "properties.view",
    "clients.viewAny",
    "clients.view",
    "billing.viewEntitlement",
    "notifications.viewAny",
  ]);
  assert.deepEqual(resolveManagerEditorPermissions([]), []);
  assert.deepEqual(resolveManagerEditorPermissions(catalog.slice(0, 1)), [
    "properties.viewAny",
    "properties.view",
  ]);
  // Catalog refreshes must not reapply defaults after deselection or editing.
  assert.deepEqual(resolveManagerEditorPermissions(catalog, []), []);
  assert.deepEqual(
    resolveManagerEditorPermissions(catalog, ["properties.update"]),
    ["properties.update"],
  );
});
function fixture() {
  const calls = [];
  const gateway = {
    creationMode: "invitation",
    supportsAssignments: true,
    supportsPermissions: true,
    create: async (...args) => {
      calls.push(["create", ...args]);
      return invitation;
    },
    list: async () => ({
      managers: [manager],
      invitations: [],
      records: [manager],
      total: 1,
      complete: true,
      capacity,
    }),
    update: async (...args) => {
      calls.push(["update", ...args]);
      return manager;
    },
    updateInvitation: async (...args) => {
      calls.push(["updateInvitation", ...args]);
      return invitation;
    },
    resendInvitation: async (...args) => {
      calls.push(["resend", ...args]);
      return invitation;
    },
    revokeInvitation: async (...args) => {
      calls.push(["revoke", ...args]);
    },
    setEnabled: async (...args) => {
      calls.push(["setEnabled", ...args]);
      return manager;
    },
    remove: async (...args) => {
      calls.push(["remove", ...args]);
    },
  };
  return { calls, gateway };
}
test("every staff operation rejects a manager, including bypassed form submissions", async () => {
  const { gateway, calls } = fixture();
  const service = createStaffService(gateway, () =>
    normalizeAccess({ role: "MANAGER" }),
  );
  for (const operation of [
    () => service.list(),
    () => service.create(details),
    () => service.update(manager, details),
    () => service.resend("i1"),
    () => service.revoke("i1"),
    () => service.setEnabled("m1", false),
    () => service.remove("m1"),
  ])
    await assert.rejects(operation, /Only account owners/);
  assert.deepEqual(calls, []);
});
test("owner lifecycle dispatches accounts and invitations through distinct endpoints", async () => {
  const { gateway, calls } = fixture();
  const service = createStaffService(gateway, () => owner, "token");
  await service.create(details);
  await service.update(manager, details);
  await service.update(invitation, details);
  await service.resend("i1");
  await service.revoke("i1");
  await service.setEnabled("m1", false);
  await service.remove("m1");
  assert.deepEqual(
    calls.map((call) => call[0]),
    [
      "create",
      "update",
      "updateInvitation",
      "resend",
      "revoke",
      "setEnabled",
      "remove",
    ],
  );
});
test("server capacity includes reservations and fails closed", async () => {
  const { gateway, calls } = fixture();
  gateway.list = async () => ({
    managers: [],
    invitations: [],
    records: [],
    total: 0,
    complete: true,
    capacity: { ...capacity, remaining: 0 },
  });
  await assert.rejects(
    () => createStaffService(gateway, () => owner).create(details),
    /Staff capacity reached/,
  );
  assert.deepEqual(calls, []);
  assert.equal(canAddManager(), false);
  assert.equal(canAddManager({ ...capacity, remaining: 0 }), false);
  assert.equal(canAddManager({ ...capacity, accessMode: "read_only" }), false);
  assert.equal(canAddManager(capacity), true);
  assert.equal(canAddManager({ ...capacity, accessMode: "unknown" }), false);
});
test("roster normalizes account and invitation states with required capacity metadata", () => {
  const wireManager = {
    id: "m1",
    name: "Manager",
    email: "manager@example.test",
    role: "MANAGER",
    is_active: false,
    permissions: null,
    assigned_property_ids: ["p1"],
  };
  const roster = normalizeStaffRoster({
    data: [wireManager],
    invitations: [
      {
        ...wireManager,
        id: "i1",
        status: "pending",
        delivery_status: "failed",
      },
      { ...wireManager, id: "i2", status: "expired", delivery_status: "sent" },
    ],
    capacity: {
      limit: 5,
      accounts_used: 2,
      invitations_reserved: 1,
      remaining: 2,
      access_mode: "active",
    },
  });
  assert.equal(roster.managers[0].status, "disabled");
  assert.deepEqual(roster.managers[0].permissions, []);
  assert.deepEqual(
    roster.invitations.map((item) => item.status),
    ["delivery_failed", "expired"],
  );
  assert.equal(roster.records.length, 3);
  assert.deepEqual(roster.capacity, capacity);
  assert.throws(
    () => normalizeStaffRoster({ data: [wireManager] }),
    /capacity/,
  );
});
test("server permission catalog is the only editor source", () => {
  assert.deepEqual(
    normalizePermissionCatalog({
      data: [
        {
          label: "Properties",
          options: [
            {
              label: "View",
              grants: ["properties.view", "properties.viewAny"],
            },
          ],
        },
      ],
    }),
    [
      {
        label: "Properties",
        options: [
          { label: "View", grants: ["properties.view", "properties.viewAny"] },
        ],
      },
    ],
  );
  assert.throws(
    () =>
      normalizePermissionCatalog({
        data: [
          { label: "Properties", options: [{ label: "Bad", grants: "all" }] },
        ],
      }),
    /permissions/,
  );
  assert.throws(() => normalizePermissionCatalog({ data: {} }), /permissions/);
});
test("HTTP gateway omits role and password and uses invitation lifecycle routes", async () => {
  const calls = [];
  const wireInvitation = {
    id: "i1",
    name: "Manager",
    email: "manager@example.test",
    role: "MANAGER",
    status: "pending",
    delivery_status: "queued",
    permissions: [],
    assigned_property_ids: [],
  };
  const transport = {
    get: async (path) => {
      calls.push(["GET", path]);
      return path === "/users"
        ? {
            data: [],
            invitations: [],
            capacity: {
              limit: 5,
              accounts_used: 1,
              invitations_reserved: 0,
              remaining: 4,
              access_mode: "active",
            },
          }
        : {
            data: [
              {
                label: "Properties",
                options: [{ label: "View", grants: ["properties.view"] }],
              },
            ],
          };
    },
    post: async (path, payload) => {
      calls.push(["POST", path, payload]);
      return { data: wireInvitation };
    },
    patch: async (path, payload) => {
      calls.push(["PATCH", path, payload]);
      return { data: wireInvitation };
    },
    remove: async (path) => {
      calls.push(["DELETE", path]);
    },
  };
  const gateway = createHttpStaffGateway(transport, staffApiContract);
  const payload = { ...details, password: "never-send", role: "ADMIN" };
  await gateway.list();
  await gateway.catalog();
  await gateway.create(payload);
  await gateway.updateInvitation("i/1", payload);
  await gateway.resendInvitation("i/1");
  await gateway.revokeInvitation("i/1");
  assert.deepEqual(
    calls.map((call) => call.slice(0, 2)),
    [
      ["GET", "/users"],
      ["GET", "/staff/access-catalog"],
      ["POST", "/staff/invitations"],
      ["PATCH", "/staff/invitations/i%2F1"],
      ["POST", "/staff/invitations/i%2F1/resend"],
      ["DELETE", "/staff/invitations/i%2F1"],
    ],
  );
  assert.equal(calls[2][2].password, undefined);
  assert.equal(calls[2][2].role, undefined);
  assert.deepEqual(calls[2][2].permissions, []);
});
