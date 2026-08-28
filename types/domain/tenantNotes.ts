export const TENANT_NOTE_CATEGORIES = [
  "General",
  "Maintenance",
  "Financial",
  "Behavior",
] as const;

export type TenantNoteCategory = (typeof TENANT_NOTE_CATEGORIES)[number];

export type TenantNote = {
  id: string;
  clientId: string;
  content: string;
  category: TenantNoteCategory;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TenantNoteDraft = {
  content: string;
  category: TenantNoteCategory;
  date: string;
};

export type CreateTenantNotePayload = TenantNoteDraft & {
  clientId: string;
};

export type UpdateTenantNotePayload = Partial<TenantNoteDraft>;

export type TenantNoteListParams = {
  category?: TenantNoteCategory;
  clientId: string;
  page?: number;
  perPage?: number;
};

export type TenantNotePage = {
  data: TenantNote[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};
