import type { Bedspace } from "./bedspaces";

export type Lessee = {
  id: string;
  tenantId?: string;
  name: string;
  contactEmail: string;
  phone: string;
};

export type Lease = {
  id: string;
  propertyId: string;
  lesseeId: string;
  roomId?: string | null;
  bedspaceId?: string | null;
  roomNumber?: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: "Active" | "Expired" | "Terminated" | string;
  lessee?: Lessee;
  bedspace?: Bedspace;
};

export type PaymentStatus = "Paid" | "Pending" | "Overdue" | string;

export type LeasePayment = {
  id: string;
  leaseId: string;
  type: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: PaymentStatus;
  paymentMethod?: string | null;
  referenceNo?: string | null;
};

export type LeaseLedger = {
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  payments: LeasePayment[];
};

export type TenantFinancialLedger = LeaseLedger;

export type PropertyDocument = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "JPG" | "PNG";
  category: "Leases" | "Compliance" | "Maintenance" | "Contracts" | string;
  size: string;
  date: string;
  url?: string;
  mimeType?: string;
  propertyId?: string;
  lesseeId?: string;
};

export type DocumentUpload = {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file?: Blob;
};

export type DocumentCategory =
  | "Leases"
  | "Compliance"
  | "Maintenance"
  | "Contracts";

export type DocumentUpdatePayload = {
  name?: string;
  category?: DocumentCategory;
  propertyId?: string | null;
  lesseeId?: string | null;
  file?: DocumentUpload;
  revisionComment?: string;
};

export type LeasePayload = {
  amendmentEffectiveDate?: string;
  amendmentReason?: string;
  propertyId: string;
  lesseeId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  roomId?: string | null;
  bedspaceId?: string | null;
  roomNumber?: string;
  status?: string;
};

export type LesseePayload = {
  name: string;
  contactEmail: string;
  phone: string;
};
