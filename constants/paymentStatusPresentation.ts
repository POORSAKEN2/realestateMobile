import type { PaymentStatus } from "../types/domain/payments";

const paymentStatusPresentation = {
  Paid: {
    containerClass: "border-success/25 bg-successSurface",
    textClass: "text-success",
    iconColor: "success",
  },
  Pending: {
    containerClass: "border-primary/25 bg-primary/10",
    textClass: "text-textPrimary",
    iconColor: "primary",
  },
  Overdue: {
    containerClass: "border-secondary/40 bg-secondary/20",
    textClass: "text-textPrimary",
    iconColor: "secondary",
  },
} as const;

/** Shared brand treatments for collection totals, payment badges and ledger rows. */
export function getPaymentStatusPresentation(status: PaymentStatus) {
  return paymentStatusPresentation[status] ?? paymentStatusPresentation.Pending;
}
