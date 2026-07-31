import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import type { ApiEnvelope, Lessee, LesseePayload } from "../types";

export function normalizeClient(client: Record<string, any>): Lessee {
  return {
    ...client,
    id: String(client?.clientId ?? client?.client_id ?? client?.id ?? ""),
    tenantId: String(client?.tenantId ?? client?.tenant_id ?? ""),
    name: String(client?.name ?? "Linked tenant"),
    contactEmail: String(
      client?.contactEmail ?? client?.contact_email ?? client?.domain ?? "",
    ),
    phone: String(client?.phone ?? client?.contact_number ?? ""),
  };
}

export async function fetchClients(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/clients", { headers: authHeaders(accessToken) });
  return unwrapCollection(response).map(normalizeClient);
}

function toApiPayload(payload: LesseePayload) {
  return {
    name: payload.name,
    contact_email: payload.contactEmail,
    phone: payload.phone,
  };
}

export async function createClient(
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/clients", toApiPayload(payload), { headers: authHeaders(accessToken) });
  return normalizeClient(unwrapData(response));
}

export async function updateClient(
  id: string,
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/clients/${id}`, toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });
  return normalizeClient(unwrapData(response));
}

export async function deleteClient(id: string, accessToken?: string) {
  await apiClient.delete(`/clients/${id}`, {
    headers: authHeaders(accessToken),
  });
}
