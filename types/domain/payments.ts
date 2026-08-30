import type { Lease, Lessee, Property } from "./propertyDetails";

export type PaymentType = "Rent" | "Deposit" | "Downpayment" | "Late Fee" | "Other";
export type PaymentStatus = "Paid" | "Pending" | "Overdue";

export interface Payment {
  id: string;
  lease_id?: string;
  leaseId?: string;
  lease?: Lease;
  property?: Property;
  lessee?: Lessee;
  type: PaymentType;
  amount: number;
  due_date: string;
  dueDate?: string;
  paid_date?: string | null;
  paidDate?: string | null;
  status: PaymentStatus;
  reference_no?: string | null;
  referenceNo?: string | null;
  is_recurring?: boolean;
  notes?: string | null;
  created_at?: string;
}

export interface RecordPaymentPayload {
  lease_id: string;
  amount: number;
  type: PaymentType;
  due_date?: string;
  paid_date?: string;
  status: PaymentStatus;
  reference_no?: string;
  notes?: string;
}

export interface LeaseLedgerData {
  total_due: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  payments: Payment[];
}
