import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { getPropertyManageActions } = load(
  "../../components/properties/getPropertyManageActions.ts",
);
const { normalizeAccess } = load("../../utils/auth/accessAdapter.ts");
const { permits } = load("../../utils/auth/accessPolicy.ts");

const property = {
  id: "p1",
  title: "Transient Booking",
  type: "Single Family Home",
  floorplans: [],
  isTransientBookable: true,
};

function actionsFor(record, access, onEdit = () => {}) {
  return getPropertyManageActions(
    record,
    (permission, propertyId) => permits(access, permission, propertyId),
    {
      onBedspaces: () => {},
      onFloorPlans: () => {},
      onBookings: () => {},
      onEdit,
      onArchive: () => {},
      onRestore: () => {},
    },
  );
}

test("active ADMIN sees applicable management actions", () => {
  const actions = actionsFor(property, normalizeAccess({ role: "ADMIN" }));
  assert.deepEqual(
    actions.map(({ label }) => label),
    ["Bedspaces", "Floor plans", "Bookings", "Edit", "Archive"],
  );
  assert.deepEqual(
    actions.map(({ section }) => section),
    ["Spaces", "Spaces", "Management", "Management", "Lifecycle"],
  );
  assert.equal(actions.at(-1).destructive, true);
});

test("MANAGER sees only granted actions for an assigned property", () => {
  const access = normalizeAccess({
    role: "MANAGER",
    assigned_property_ids: ["p1"],
    permissions: [
      "properties.viewAny",
      "bedspaces.viewAny",
      "properties.update",
    ],
  });
  let edits = 0;
  const actions = actionsFor(property, access, () => {
    edits += 1;
  });
  assert.deepEqual(
    actions.map(({ label }) => label),
    ["Bedspaces", "Edit"],
  );
  actions[1].onPress();
  assert.equal(edits, 1);
  assert.deepEqual(actionsFor({ ...property, id: "p2" }, access), []);
});

test("property availability hides inapplicable floor plans and bookings", () => {
  const actions = actionsFor(
    {
      ...property,
      type: "Empty Lot",
      isTransientBookable: false,
    },
    normalizeAccess({ role: "ADMIN" }),
  );
  assert.deepEqual(
    actions.map(({ label }) => label),
    ["Bedspaces", "Edit", "Archive"],
  );

  const withExistingLayout = actionsFor(
    { ...property, type: "Empty Lot", floorplans: [{ id: "f1", areas: [] }] },
    normalizeAccess({ role: "ADMIN" }),
  );
  assert.equal(
    withExistingLayout.some(({ label }) => label === "Floor plans"),
    true,
  );
});

test("archived property offers only permitted Restore", () => {
  const archived = { ...property, archivedAt: "2026-09-30T00:00:00Z" };
  assert.deepEqual(
    actionsFor(archived, normalizeAccess({ role: "ADMIN" })).map(
      ({ label, section }) => [label, section],
    ),
    [["Restore", "Lifecycle"]],
  );
  assert.deepEqual(
    actionsFor(
      archived,
      normalizeAccess({
        role: "MANAGER",
        assigned_property_ids: ["p1"],
        permissions: ["properties.restore"],
      }),
    ),
    [],
  );
});
