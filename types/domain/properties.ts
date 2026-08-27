import type { FloorPlan } from "./floorplans";

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

export type SpatialCapabilityLevel =
  | "recommended"
  | "optional"
  | "discouraged"
  | "unsupported";

export type PropertySpatialCapabilities = {
  floorplans?: SpatialCapabilityLevel;
  rooms?: SpatialCapabilityLevel;
};

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
  roomCount: number;
  bedspaceCount: number;
  vacantBedspaceCount: number;
  occupiedBedspaceCount: number;
  maintenanceBedspaceCount: number;
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
  totalUnits?: number;
  floorplans?: FloorPlan[];
  spatialCapabilities?: PropertySpatialCapabilities;
};

export type PropertyImageUpload = {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
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

export type UpdatePropertyPayload = Omit<
  CreatePropertyPayload,
  "image" | "images"
> & {
  image?: PropertyImageUpload | string;
  images?: Array<PropertyImageUpload | string>;
  retained_images?: string[];
};
