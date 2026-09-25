import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  normalizeExpense,
  normalizeExpenseActivityPage,
  validateExpenseTransitionReason,
} = load("../../utils/expenses/expenseGovernance.ts");

test("maps backend lifecycle authority without inventing transitions", () => {
  const expense = normalizeExpense({
    id: 7,
    property_id: 9,
    amount: "125.50",
    date: "2026-09-25T03:00:00Z",
    status: "Paid",
    approval_status: "Approved",
    lifecycle_status: "Paid",
    allowed_transitions: [{ status: "Voided", requires_reason: true }],
    receipts: [{ id: "4", state: "Retired", url: "/receipt/4" }],
  });

  assert.equal(expense.id, "7");
  assert.equal(expense.property_id, "9");
  assert.equal(expense.amount, 125.5);
  assert.equal(expense.date, "2026-09-25");
  assert.equal(expense.payment_status, "Paid");
  assert.equal(expense.lifecycle_status, "Paid");
  assert.deepEqual(expense.allowed_transitions, [
    { status: "Voided", requires_reason: true },
  ]);
  assert.equal(expense.receipts[0].state, "Retired");
});

test("fails closed when lifecycle actions are absent or malformed", () => {
  assert.deepEqual(normalizeExpense({ id: "1" }).allowed_transitions, []);
  assert.deepEqual(
    normalizeExpense({ id: "1", allowed_transitions: "Approved" })
      .allowed_transitions,
    [],
  );
});

test("normalizes activity pagination and empty responses", () => {
  const item = {
    id: "event-1",
    type: "transition",
    action: "expense.status_changed",
    actor: { id: "admin-1", name: "Admin", role: "ADMIN" },
    occurred_at: "2026-09-25T03:00:00Z",
    reason: "Duplicate",
    before_values: { lifecycle_status: "Approved" },
    after_values: { lifecycle_status: "Voided" },
  };
  assert.deepEqual(normalizeExpenseActivityPage(null), {
    items: [],
    next_cursor: null,
  });
  assert.deepEqual(
    normalizeExpenseActivityPage({ items: [item], next_cursor: "cursor-2" }),
    { items: [item], next_cursor: "cursor-2" },
  );
});

test("requires a nonblank reason only when backend marks it required", () => {
  assert.equal(
    validateExpenseTransitionReason(true, "  "),
    "Reason is required.",
  );
  assert.equal(validateExpenseTransitionReason(true, "Correction"), undefined);
  assert.equal(validateExpenseTransitionReason(false), undefined);
});
