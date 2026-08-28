import {
  createTenantNote,
  deleteTenantNote,
  fetchTenantNotes,
  updateTenantNote,
} from "../api/tenantNotes";
import type {
  CreateTenantNotePayload,
  TenantNote,
  TenantNoteListParams,
  TenantNotePage,
  UpdateTenantNotePayload,
} from "../types";

export interface TenantNoteRepository {
  create(
    payload: CreateTenantNotePayload,
    accessToken?: string,
  ): Promise<TenantNote>;
  delete(id: string, accessToken?: string): Promise<void>;
  list(
    params: TenantNoteListParams,
    accessToken?: string,
    signal?: AbortSignal,
  ): Promise<TenantNotePage>;
  update(
    id: string,
    payload: UpdateTenantNotePayload,
    accessToken?: string,
  ): Promise<TenantNote>;
}

export const apiTenantNoteRepository: TenantNoteRepository = {
  create: createTenantNote,
  delete: deleteTenantNote,
  list: fetchTenantNotes,
  update: updateTenantNote,
};
