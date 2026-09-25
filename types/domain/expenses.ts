import type { Property } from "./properties";

export type ExpenseCategory =
  | "MAINTENANCE"
  | "UTILITIES"
  | "TAXES"
  | "INSURANCE"
  | "MANAGEMENT"
  | "SUPPLIES"
  | "LEGAL"
  | "MARKETING"
  | "OTHER";

export type ExpenseApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Voided";
export type ExpenseLifecycleStatus = ExpenseApprovalStatus | "Paid";

export interface ExpenseReceipt {
  id: string;
  url: string;
  name?: string;
  file_name?: string;
  size?: number;
  mime_type?: string;
  state: "Active" | "Retired";
}

export type Expense = {
  id: string;
  property_id: string;
  tenant_id: string;
  support_ticket_id: string | null;
  property?: Property | null;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  reference_no: string | null;
  status: "Pending" | "Paid" | "Cancelled";
  approval_status?: ExpenseApprovalStatus;
  approvalStatus?: ExpenseApprovalStatus;
  lifecycle_status: ExpenseLifecycleStatus;
  payment_status: "Pending" | "Paid";
  allowed_transitions: Array<{
    status: ExpenseLifecycleStatus;
    requires_reason: boolean;
  }>;
  description: string | null;
  receipts?: ExpenseReceipt[];
};

export type ExpenseImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type CreateExpensePayload = {
  property_id: string;
  tenant_id?: string;
  support_ticket_id?: string | null;
  property?: Property;
  category: string;
  amount: number;
  date: string;
  reference_no?: string | null;
  description?: string | null;
  receipts?: ExpenseImageUpload[];
};

export type UpdateExpensePayload = CreateExpensePayload;

export type ExpenseActivity = {
  id: string;
  type: "edit" | "transition" | "evidence";
  action: string;
  actor: { id: string; name: string | null; role: string | null } | null;
  occurred_at: string;
  reason: string | null;
  before_values: Record<string, unknown>;
  after_values: Record<string, unknown>;
};

export type ExpenseActivityPage = {
  items: ExpenseActivity[];
  next_cursor: string | null;
};
