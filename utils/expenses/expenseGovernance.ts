import type { Expense, ExpenseActivityPage } from "../../types/domain/expenses";

function normalizeExpenseStatus(status: unknown): Expense["status"] {
  const value = String(status ?? "").toUpperCase();
  if (value === "PAID") return "Paid";
  if (value === "CANCELLED") return "Cancelled";
  return "Pending";
}

function normalizeApprovalStatus(status: unknown): Expense["approval_status"] {
  const value = String(status ?? "").toUpperCase();
  if (value === "APPROVED") return "Approved";
  if (value === "REJECTED") return "Rejected";
  if (value === "VOIDED") return "Voided";
  return "Pending";
}

export function normalizeExpense(expense: Record<string, any>): Expense {
  const rawDate = expense?.date ?? new Date().toISOString();
  const formattedDate = String(rawDate).trim().split("T")[0];

  return {
    ...expense,
    id: String(expense?.id ?? ""),
    property_id: String(
      expense?.property_id ?? expense?.linkedAsset ?? expense?.propertyId ?? "",
    ),
    tenant_id: String(expense?.tenant_id ?? expense?.tenantId ?? ""),
    support_ticket_id: expense?.support_ticket_id ?? null,
    property: expense?.property ?? null,
    category: expense?.category ?? "OTHER",
    amount: Number(expense?.amount ?? 0),
    date: formattedDate,
    status: normalizeExpenseStatus(expense?.status),
    payment_status:
      normalizeExpenseStatus(expense?.payment_status ?? expense?.status) ===
      "Paid"
        ? "Paid"
        : "Pending",
    approval_status: normalizeApprovalStatus(
      expense?.approval_status ?? expense?.approvalStatus,
    ),
    approvalStatus: normalizeApprovalStatus(
      expense?.approval_status ?? expense?.approvalStatus,
    ),
    lifecycle_status: expense?.lifecycle_status ?? "Pending",
    allowed_transitions: Array.isArray(expense?.allowed_transitions)
      ? expense.allowed_transitions
      : [],
    reference_no: expense?.reference_no ?? expense?.referenceNumber ?? null,
    description: expense?.description ?? null,
    receipts: Array.isArray(expense?.receipts) ? expense.receipts : [],
  } as Expense;
}

export function normalizeExpenseActivityPage(
  page: Partial<ExpenseActivityPage> | null | undefined,
): ExpenseActivityPage {
  return {
    items: Array.isArray(page?.items) ? page.items : [],
    next_cursor:
      typeof page?.next_cursor === "string" && page.next_cursor.length > 0
        ? page.next_cursor
        : null,
  };
}

export function validateExpenseTransitionReason(
  requiresReason: boolean,
  reason?: string,
): string | undefined {
  if (requiresReason && !reason?.trim()) return "Reason is required.";
  return undefined;
}
