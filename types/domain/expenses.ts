import type { Property } from "./properties";

export type Expense = {
  id: string;
  property_id: string;
  tenant_id: string;
  support_ticket_id: string | null;
  property?: Property | null;
  category: string;
  amount: number;
  date: string;
  reference_no: string | null;
  status: "Pending" | "Paid" | "Cancelled";
  description: string | null;
};

export type ExpenseImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type CreateExpensePayload = {
  property_id: string;
  tenant_id: string;
  support_ticket_id: string | null;
  property: Property;
  category: string;
  amount: number;
  date: string;
  reference_no: string | null;
  status: string;
  description: string | null;
};

export type UpdateExpensePayload = CreateExpensePayload;
