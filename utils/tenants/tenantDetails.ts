import type {
  LeaseLedger,
  LeasePayment,
  PaymentStatus,
  TenantFinancialLedger,
} from "../../types";

export function normalizeLeasePayment(
  payment: Record<string, any>,
): LeasePayment {
  return {
    id: String(payment?.id ?? ""),
    leaseId: String(payment?.leaseId ?? payment?.lease_id ?? ""),
    type: String(payment?.type ?? "Rent"),
    amount: Number(payment?.amount ?? 0),
    dueDate: String(payment?.dueDate ?? payment?.due_date ?? "").slice(0, 10),
    paidDate: payment?.paidDate ?? payment?.paid_date ?? null,
    status: String(payment?.status ?? "Pending"),
    paymentMethod: payment?.paymentMethod ?? payment?.payment_method ?? null,
    referenceNo: payment?.referenceNo ?? payment?.reference_no ?? null,
  };
}

export function normalizeLeaseLedger(ledger: Record<string, any>): LeaseLedger {
  return {
    totalDue: Number(ledger?.totalDue ?? ledger?.total_due ?? 0),
    totalPaid: Number(ledger?.totalPaid ?? ledger?.total_paid ?? 0),
    totalOutstanding: Number(
      ledger?.totalOutstanding ?? ledger?.total_outstanding ?? 0,
    ),
    totalOverdue: Number(ledger?.totalOverdue ?? ledger?.total_overdue ?? 0),
    payments: Array.isArray(ledger?.payments)
      ? ledger.payments.map(normalizeLeasePayment)
      : [],
  };
}

export function aggregateLeaseLedgers(
  ledgers: LeaseLedger[],
): TenantFinancialLedger {
  return {
    totalDue: ledgers.reduce((sum, ledger) => sum + ledger.totalDue, 0),
    totalPaid: ledgers.reduce((sum, ledger) => sum + ledger.totalPaid, 0),
    totalOutstanding: ledgers.reduce(
      (sum, ledger) => sum + ledger.totalOutstanding,
      0,
    ),
    totalOverdue: ledgers.reduce((sum, ledger) => sum + ledger.totalOverdue, 0),
    payments: ledgers
      .flatMap((ledger) => ledger.payments)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
  };
}

export function formatTenantDetailDate(value: string) {
  if (!value) return "No due date";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getPaymentStatusStyle(status: PaymentStatus) {
  switch (status) {
    case "Paid":
      return { backgroundColor: "#D8F3EA", color: "#157457" };
    case "Overdue":
      return { backgroundColor: "#FDE2E2", color: "#B42318" };
    default:
      return { backgroundColor: "#FFF0DD", color: "#B85D0A" };
  }
}
