import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { ApiError } = load("../../api/errors.ts");
const { deletionImpactFromError, normalizeDeletionImpact } = load(
  "../../utils/governance/deletionImpact.ts",
);
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { permits } = load("../../utils/auth/accessPolicy.ts");
const { describeRequest } = load("../../services/access/requestPolicy.ts");

const payload = {
  target: { resource: "properties", id: "p1", label: "North", archived_at: null },
  action: "archive",
  can_execute: false,
  blockers: [{ code: "active_leases", resource: "leases", count: 1, records: [{ id: "l1", label: "Lease 1", status: "Active" }] }],
  warnings: [],
  inspected_at: "2026-09-24T00:00:00Z",
  pagination: { page: 1, per_page: 50, has_more: false, next_page: null },
};

test("normalizes deletion impact and refreshed 409 payloads", () => {
  const impact = normalizeDeletionImpact(payload);
  assert.equal(impact.canExecute, false);
  assert.equal(impact.target.archivedAt, null);
  assert.equal(impact.blockers[0].records[0].status, "Active");
  assert.deepEqual(
    deletionImpactFromError(new ApiError("Blocked", 409, "deletion_blocked", { impact: payload })),
    impact,
  );
});

test("manager stale grants never expose governed destructive actions", () => {
  const manager = normalizeAccess({
    role: "MANAGER",
    permissions: [
      "deletion.preview",
      "properties.archive",
      "documents.restore",
      "clients.delete",
      "leases.delete",
      "bookings.delete",
      "rooms.delete",
      "floorplans.delete",
      "areas.delete",
      "bedspaces.delete",
      "payments.delete",
      "expenses.delete",
    ],
  });
  for (const permission of manager.permissions) assert.equal(permits(manager, permission), false);
});

test("archive, restore, and preview requests use dedicated permissions", () => {
  assert.equal(describeRequest("/properties/p1/archive", "POST").permission, "properties.archive");
  assert.equal(describeRequest("/documents/d1/restore", "POST").permission, "documents.restore");
  assert.equal(
    describeRequest("/governance/deletion-impact/properties/p1", "GET").permission,
    "deletion.preview",
  );
});
