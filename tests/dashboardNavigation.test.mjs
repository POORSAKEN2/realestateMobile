import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { dashboardNavigationSections } = load("../../constants/dashboardNavigation.ts");
const { appRoutes, resolveModuleRoute } = load("../../constants/navigation.ts");

test("Home contains operations and portfolio shortcuts only", () => {
  assert.deepEqual(dashboardNavigationSections.map(({ title }) => title), [
    "Operations",
    "Portfolio Intelligence",
  ]);
  assert.deepEqual(dashboardNavigationSections[0].items.map(({ label }) => label), [
    "Inquiries & Leads", "Leases", "Rent", "Expenses", "Documents", "Bookings",
  ]);
  assert.deepEqual(dashboardNavigationSections[1].items.map(({ label }) => label), [
    "Analytics & Reports", "Mapped Properties", "Public Listing", "AI Assistant",
  ]);
});

test("removed Home shortcuts retain their feature routes", () => {
  for (const [module, route] of [
    ["workspace-settings", appRoutes.secondary.workspaceSettings],
    ["staff-management", appRoutes.secondary.staffManagement],
    ["billing", appRoutes.secondary.billing],
    ["notificationScreen", appRoutes.secondary.notifications],
    ["support", appRoutes.secondary.support],
  ]) {
    assert.equal(resolveModuleRoute(module), route);
    assert.ok(!dashboardNavigationSections.some(({ items }) => items.some(({ href }) => href === route)));
  }
});
