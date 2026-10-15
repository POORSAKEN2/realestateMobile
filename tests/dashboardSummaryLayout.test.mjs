import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import test from "node:test";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const { getDashboardSummaryLayout } = loadWithMocks(
  fileURLToPath(
    new URL(
      "../components/dashboard/summary/useDashboardSummaryLayout.ts",
      import.meta.url,
    ),
  ),
  { "react-native": {} },
);

test("phone cards retain the stacked summary with a readable metric row", () => {
  const admin = getDashboardSummaryLayout(370, 1, 3);
  const manager = getDashboardSummaryLayout(370, 1, 2);
  assert.equal(admin.isWide, false);
  assert.equal(admin.padding, 16);
  assert.equal(admin.stackMetrics, false);
  assert.equal(manager.stackMetrics, false);
});

test("narrow cards and enlarged text stack metrics instead of squeezing labels", () => {
  assert.equal(getDashboardSummaryLayout(280, 1, 3).stackMetrics, true);
  assert.equal(getDashboardSummaryLayout(370, 2, 3).stackMetrics, true);
  assert.equal(getDashboardSummaryLayout(370, 2, 2).stackMetrics, true);
});

test("tablet cards use a horizontal summary without forcing a cramped metric row", () => {
  assert.equal(getDashboardSummaryLayout(1024, 1, 3).isWide, true);
  assert.equal(getDashboardSummaryLayout(1024, 1, 3).padding, 24);
  assert.equal(getDashboardSummaryLayout(1024, 1, 3).stackMetrics, false);
  assert.equal(getDashboardSummaryLayout(720, 2, 3).stackMetrics, true);
});

test("layout follows the current container through Split View and font changes", () => {
  assert.equal(getDashboardSummaryLayout(1100, 1, 3).isWide, true);
  assert.equal(getDashboardSummaryLayout(719, 1, 3).isWide, false);
  assert.equal(getDashboardSummaryLayout(1100, 3, 3).stackMetrics, true);
  assert.equal(getDashboardSummaryLayout(1100, 1, 3).stackMetrics, false);
  assert.equal(getDashboardSummaryLayout(0, 1, 3).stackMetrics, true);
});
