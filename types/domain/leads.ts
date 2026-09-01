export type ListingLeadType = "inquiry" | "viewing";
export type ListingLeadStatus = "new" | "contacted" | "closed";

export interface ListingLead {
  id: string;
  leadType: ListingLeadType;
  propertyId: string;
  propertyTitle?: string;
  name: string;
  contact: string;
  message?: string;
  viewingDate?: string;
  viewingTime?: string;
  status: ListingLeadStatus;
  createdAt: string;
}

export interface UpdateLeadStatusPayload {
  id: string;
  leadType: ListingLeadType;
  status: ListingLeadStatus;
}
