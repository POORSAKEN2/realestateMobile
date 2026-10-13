import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  quickNavigationItems,
  getQuickNavigationItems,
  getCenterNavigationAction,
} = load("../../constants/quickNavigation.ts");
const { dashboardNavigationSections, supportNavigationItem } = load(
  "../../constants/dashboardNavigation.ts",
);

test("quick navigation exposes nine working destinations in approved order", () => {
  assert.deepEqual(
    quickNavigationItems.map(({ label }) => label),
    [
      "Inquiries",
      "Leases",
      "Rent",
      "Expenses",
      "Documents",
      "Bookings",
      "Analytics",
      "Map",
      "Support",
    ],
  );
  assert.equal(new Set(quickNavigationItems.map(({ href }) => href)).size, 9);
  for (const { href } of quickNavigationItems) {
    assert.ok(
      fs.existsSync(
        path.resolve(import.meta.dirname, "../app", `${href.slice(1)}.tsx`),
      ),
      href,
    );
  }
});

test("manager center action opens the existing Mapped Properties destination", () => {
  for (const user of [
    { role: "MANAGER", permissions: ["properties.viewAny"] },
    {
      role: " manager ",
      access: { permissions: ["properties.viewAny"], propertyIds: [] },
    },
  ]) {
    const action = getCenterNavigationAction(user);
    assert.equal(action.type, "mapped-properties");
    assert.equal(action.item, dashboardNavigationSections[1].items[1]);
  }
});

test("manager center action fails closed without map access, even with other shortcuts", () => {
  for (const user of [
    { role: "MANAGER" },
    { role: "MANAGER", permissions: ["documents.viewAny"] },
    {
      role: "MANAGER",
      permissions: ["properties.viewAny"],
      access: { permissions: [] },
    },
  ]) {
    assert.deepEqual(getCenterNavigationAction(user), {
      type: "mapped-properties",
      item: null,
    });
  }
});

test("admin and owner center actions retain quick navigation", () => {
  for (const role of ["ADMIN", "OWNER"]) {
    assert.deepEqual(getCenterNavigationAction({ role }), {
      type: "quick-navigation",
    });
  }
});

test("quick shortcuts share existing routes, permissions and icons", () => {
  const existing = [
    ...dashboardNavigationSections.flatMap(({ items }) => items),
    supportNavigationItem,
  ];
  for (const item of quickNavigationItems) {
    const source = existing.find(({ href }) => href === item.href);
    assert.ok(source);
    assert.equal(item.permission, source.permission);
    assert.equal(item.icon, source.icon);
  }
});

test("admin sees all shortcuts; manager sees granted destinations only", () => {
  assert.equal(
    getQuickNavigationItems({ role: "ADMIN", access: { permissions: null } })
      .length,
    9,
  );
  assert.deepEqual(
    getQuickNavigationItems({
      role: "MANAGER",
      permissions: ["expenses.viewAny", "support-tickets.viewAny"],
    }).map(({ label }) => label),
    ["Expenses", "Support"],
  );
  assert.deepEqual(
    getQuickNavigationItems({
      role: "ADMIN",
      access: { permissions: ["documents.viewAny"] },
    }).map(({ label }) => label),
    ["Documents"],
  );
});

test("missing session, unknown role or empty grants fail closed", () => {
  for (const user of [
    undefined,
    null,
    {},
    { role: "GUEST" },
    { role: "MANAGER" },
    { role: "MANAGER", permissions: [] },
    { role: "ADMIN", access: { permissions: [] } },
  ]) {
    assert.deepEqual(getQuickNavigationItems(user), []);
  }
});
