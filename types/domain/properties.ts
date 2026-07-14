export const PROPERTY_TAXONOMY = {
  Residential: [
    "Single Family Home",
    "Townhouse",
    "Apartment Unit",
    "Condominium Unit",
    "Condominium Building",
  ],
  Commercial: ["Office Space", "Coworking Space", "Mixed Use Building"],
  Industrial: ["Warehouse", "Factory", "Cold Storage"],
  Retail: ["Mall", "Storefront", "Kiosk / Booth"],
  Land: ["Empty Lot", "Agricultural Lot", "Commercial Lot"],
} as const;

export type PropertyClassification = keyof typeof PROPERTY_TAXONOMY;
export type PropertyType =
  (typeof PROPERTY_TAXONOMY)[PropertyClassification][number];

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
  classification?: PropertyClassification;
  type?: PropertyType;
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
  classification: PropertyClassification;
  type: PropertyType;
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
