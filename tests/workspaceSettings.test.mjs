import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  getWorkspaceSettingsChanges,
  resolveDashboardLocation,
  resolveWorkspaceTheme,
  validateWorkspaceSettings,
} = load("../../utils/workspaceSettings.ts");
const {
  formatCurrency,
  formatDate,
  formatNumber,
  setPresentationSettings,
} = load("../../utils/formatters.ts");

const values = {
  appName: "Acme",
  currency: "PHP",
  locale: "en-PH",
  dateFormat: "MM/DD/YYYY",
  theme: "system",
  defaultDashboardLocation: "philippines",
};
const options = {
  currencies: [{ label: "PHP", value: "PHP" }],
  locales: [{ label: "en-PH", value: "en-PH" }],
  dateFormats: [{ label: "MM/DD/YYYY", value: "MM/DD/YYYY" }],
  themes: [{ label: "System", value: "system" }],
  locations: [{ label: "Philippines", value: "philippines" }],
};

test("workspace form sends changed fields only and validates catalogs", () => {
  assert.deepEqual(getWorkspaceSettingsChanges(values, { ...values, theme: "dark" }), { theme: "dark" });
  assert.deepEqual(validateWorkspaceSettings(values, options), {});
  assert.equal(validateWorkspaceSettings({ ...values, appName: "x" }, options).appName, "Use 2 to 80 characters.");
  assert.equal(validateWorkspaceSettings({ ...values, theme: "dark" }, options).theme, "Select a supported option.");
});

test("theme resolves fixed choices and system appearance", () => {
  assert.equal(resolveWorkspaceTheme("dark", "light"), "dark");
  assert.equal(resolveWorkspaceTheme("system", "dark"), "dark");
  assert.equal(resolveWorkspaceTheme("system", null), "light");
});

test("workspace presentation controls money, number, and date formats", () => {
  setPresentationSettings({ currency: "USD", locale: "en-US", dateFormat: "YYYY-MM-DD" });
  assert.match(formatCurrency(1234), /\$1,234/);
  assert.equal(formatNumber(1234.5), "1,234.5");
  assert.equal(formatDate(new Date(2026, 8, 25)), "2026-09-25");
});

test("personal location wins over workspace fallback", () => {
  const workspace = { id: "workspace" };
  const personal = { id: "personal" };
  assert.equal(resolveDashboardLocation(personal, workspace), personal);
  assert.equal(resolveDashboardLocation(null, workspace), workspace);
});
