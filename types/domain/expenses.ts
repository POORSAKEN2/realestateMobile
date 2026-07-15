export const EXPENSE_TAXONOMY = {
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

export type ExpenseClassification = keyof typeof EXPENSE_TAXONOMY;
export type ExpenseType =
  (typeof EXPENSE_TAXONOMY)[ExpenseClassification][number];

export type Expense = {
  id: string;
  title: string;
  location: string;
  country?: string;
  status: "PENDING" | "PAID";
  classification?: ExpenseClassification;
  type?: ExpenseType;
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

export type ExpenseImageUpload = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export type CreateExpensePayload = {
  title: string;
  location: string;
  country: string;
  status: Expense["status"];
  classification: ExpenseClassification;
  type: ExpenseType;
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
  image?: ExpenseImageUpload;
  images?: ExpenseImageUpload[];
};

export type UpdateExpensePayload = CreateExpensePayload;
