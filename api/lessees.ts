import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import type { ApiEnvelope, Lessee, LesseePayload } from "../types";

export function normalizeLessee(lessee: Record<string, any>): Lessee {
  return {
    ...lessee,
    id: String(lessee?.lesseeId ?? lessee?.lessee_id ?? lessee?.id ?? ""),
    tenantId: String(
      lessee?.tenantId ??
        lessee?.tenant_id ??
        lessee?.id ??
        lessee?.lessee_id ??
        "",
    ),
    name: String(lessee?.name ?? "Linked tenant"),
    contactEmail: String(
      lessee?.contactEmail ?? lessee?.contact_email ?? lessee?.domain ?? "",
    ),
    phone: String(lessee?.phone ?? lessee?.contact_number ?? ""),
  };
}

export async function fetchLessees(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/lessees", { headers: authHeaders(accessToken) });
  return unwrapCollection(response).map(normalizeLessee);
}

function toApiPayload(payload: LesseePayload) {
  return {
    name: payload.name,
    contact_email: payload.contactEmail,
    phone: payload.phone,
  };
}

export async function createLessee(
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/lessees", toApiPayload(payload), { headers: authHeaders(accessToken) });
  return normalizeLessee(unwrapData(response));
}

export async function updateLessee(
  id: string,
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/lessees/${id}`, toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });
  return normalizeLessee(unwrapData(response));
}

export async function deleteLessee(id: string, accessToken?: string) {
  await apiClient.delete(`/lessees/${id}`, {
    headers: authHeaders(accessToken),
  });
}
