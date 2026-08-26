import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import { normalizeClient } from "./clients";
import type { ApiEnvelope, Lease, LeasePayload } from "../types";

function normalizeLease(lease: Record<string, any>): Lease {
  return {
    ...lease,
    id: String(lease?.id ?? ""),
    propertyId: String(lease?.propertyId ?? lease?.property_id ?? ""),
    lesseeId: String(
      lease?.clientId ??
        lease?.client_id ??
        lease?.lesseeId ??
        lease?.lessee_id ??
        "",
    ),
    roomNumber: lease?.roomNumber ?? lease?.room_number ?? null,
    startDate: String(lease?.startDate ?? lease?.start_date ?? "").slice(0, 10),
    endDate: String(lease?.endDate ?? lease?.end_date ?? "").slice(0, 10),
    monthlyRent: Number(lease?.monthlyRent ?? lease?.monthly_rent ?? 0),
    status: lease?.status ?? "Active",
    lessee: lease?.client
      ? normalizeClient(lease.client)
      : lease?.lessee
        ? normalizeClient(lease.lessee)
        : undefined,
  };
}

export async function fetchLeases(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/leases", { headers: authHeaders(accessToken) });
  return unwrapCollection(response).map(normalizeLease);
}

function toApiPayload(
  payload: LeasePayload,
  { includeContractTerms = true }: { includeContractTerms?: boolean } = {},
) {
  return {
    amendment_effective_date: payload.amendmentEffectiveDate,
    amendment_reason: payload.amendmentReason,
    property_id: payload.propertyId,
    client_id: payload.lesseeId,
    ...(includeContractTerms
      ? {
          start_date: payload.startDate,
          end_date: payload.endDate,
          monthly_rent: payload.monthlyRent,
        }
      : {}),
    room_number: payload.roomNumber || undefined,
    status: payload.status || "Active",
  };
}

export async function createLease(payload: LeasePayload, accessToken?: string) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/leases", toApiPayload(payload), { headers: authHeaders(accessToken) });
  return normalizeLease(unwrapData(response));
}

export async function updateLease(
  id: string,
  payload: LeasePayload,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(
    `/leases/${id}`,
    toApiPayload(payload, {
      includeContractTerms: Boolean(payload.amendmentReason),
    }),
    {
      headers: authHeaders(accessToken),
    },
  );
  return normalizeLease(unwrapData(response));
}

export async function deleteLease(id: string, accessToken?: string) {
  await apiClient.delete(`/leases/${id}`, {
    headers: authHeaders(accessToken),
  });
}
