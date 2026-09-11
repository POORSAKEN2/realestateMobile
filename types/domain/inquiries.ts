export type InquiryStatus = "new" | "contacted" | "declined";

export type InquiryStatusFilter = InquiryStatus | "all";

export interface InquiryGuest {
  name: string;
  contact: string;
}

export interface InquiryReference {
  id: string;
  title: string;
}

export interface Inquiry {
  id: string;
  guest: InquiryGuest;
  listing: InquiryReference;
  property: InquiryReference;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface InquiryFilters {
  propertyId?: string;
  query?: string;
  status?: InquiryStatusFilter;
}

export interface UpdateInquiryStatusPayload {
  id: string;
  status: InquiryStatus;
}
