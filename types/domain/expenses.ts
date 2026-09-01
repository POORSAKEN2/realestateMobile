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

export type ExpenseApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface ExpenseReceipt {
  id: string;
  url: string;
  name?: string;
  file_name?: string;
  size?: number;
  mime_type?: string;
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
  status?: string;
  approval_status?: ExpenseApprovalStatus;
  description?: string | null;
  receipts?: ExpenseImageUpload[];
};

export type UpdateExpensePayload = CreateExpensePayload;
