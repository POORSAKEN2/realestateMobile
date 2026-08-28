import type {
  ApiEnvelope,
  CreateTenantNotePayload,
  TenantNote,
  TenantNoteListParams,
  TenantNotePage,
  UpdateTenantNotePayload,
} from "../types";
import {
  normalizeTenantNote,
  normalizeTenantNotePage,
} from "../utils/tenants/tenantNoteMapper";
import { apiClient, authHeaders, unwrapData } from "./client";

function toApiPayload(
  payload: CreateTenantNotePayload | UpdateTenantNotePayload,
) {
  return {
    ...(payload.content !== undefined ? { content: payload.content } : {}),
    ...(payload.category !== undefined ? { category: payload.category } : {}),
    ...(payload.date !== undefined ? { date: payload.date } : {}),
    ...("clientId" in payload ? { client_id: payload.clientId } : {}),
  };
}

export async function fetchTenantNotes(
  params: TenantNoteListParams,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<TenantNotePage> {
  const query = [
    `client_id=${encodeURIComponent(params.clientId)}`,
    `page=${params.page ?? 1}`,
    `per_page=${params.perPage ?? 15}`,
    ...(params.category
      ? [`category=${encodeURIComponent(params.category)}`]
      : []),
  ].join("&");
  const response = await apiClient.get<unknown>(`/tenant-notes?${query}`, {
    headers: authHeaders(accessToken),
    signal,
  });

  return normalizeTenantNotePage(response);
}

export async function createTenantNote(
  payload: CreateTenantNotePayload,
  accessToken?: string,
): Promise<TenantNote> {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/tenant-notes", toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeTenantNote(unwrapData(response));
}

export async function updateTenantNote(
  id: string,
  payload: UpdateTenantNotePayload,
  accessToken?: string,
): Promise<TenantNote> {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/tenant-notes/${id}`, toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeTenantNote(unwrapData(response));
}

export async function deleteTenantNote(
  id: string,
  accessToken?: string,
): Promise<void> {
  await apiClient.delete(`/tenant-notes/${id}`, {
    headers: authHeaders(accessToken),
  });
}
