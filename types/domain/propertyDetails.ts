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
  roomNumber?: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: "Active" | "Expired" | "Terminated" | string;
  lessee?: Lessee;
};

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
  propertyId: string;
  lesseeId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  roomNumber?: string;
  status?: string;
};

export type LesseePayload = {
  name: string;
  contactEmail: string;
  phone: string;
};
