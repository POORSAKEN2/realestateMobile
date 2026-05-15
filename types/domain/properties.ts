export type Property = {
  id: string;
  title: string;
  location: string;
  country?: string;
  status:
    | "UNDER_CONSTRUCTION"
    | "PRE_LEASED"
    | "REVENUE_GENERATING"
    | "PERSONAL_USE"
    | "IDLE";
  type?: "Residential" | "Commercial" | "Industrial" | "Retail" | "Condominium";
  value: number;
  roi: number;
  occupancy?: number;
  area?: string;
  utilityScore?: string;
  bedrooms?: number;
  bathrooms?: number;
  lat?: number;
  lng?: number;
  image: string;
  images?: string[];
  parentId?: string;
  isTransientBookable?: boolean;
};

export type PropertyImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type CreatePropertyPayload = {
  title: string;
  location: string;
  country: string;
  status: Property["status"];
  type: NonNullable<Property["type"]>;
  value: number;
  roi: number;
  occupancy?: number;
  bedrooms?: number;
  bathrooms?: number;
  lat: number;
  lng: number;
  is_transient_bookable?: boolean;
  description?: string;
  area?: string;
  image?: PropertyImageUpload;
  images?: PropertyImageUpload[];
};

export type UpdatePropertyPayload = CreatePropertyPayload;
