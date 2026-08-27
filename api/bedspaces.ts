import type { ApiEnvelope, Bedspace, BedspacePayload } from "../types";
import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";

function normalizeBedspaceStatus(value: unknown): Bedspace["status"] {
  return value === "Occupied" || value === "Maintenance" ? value : "Vacant";
}

export function normalizeBedspace(value: Record<string, any>): Bedspace {
  return {
    id: String(value?.id ?? ""),
    roomId: String(value?.roomId ?? value?.room_id ?? ""),
    bedspaceNumber: String(
      value?.bedspaceNumber ?? value?.bedspace_number ?? "",
    ),
    monthlyPrice: Number(value?.monthlyPrice ?? value?.monthly_price ?? 0),
    status: normalizeBedspaceStatus(value?.status),
    notes: value?.notes ?? null,
    activeLeaseId: value?.activeLeaseId ?? value?.active_lease_id ?? null,
    clientId: value?.clientId ?? value?.client_id ?? null,
    createdAt: value?.createdAt ?? value?.created_at,
    updatedAt: value?.updatedAt ?? value?.updated_at,
  };
}

function toApiPayload(payload: Partial<BedspacePayload>) {
  return {
    ...(payload.bedspaceNumber !== undefined
      ? { bedspace_number: payload.bedspaceNumber }
      : {}),
    ...(payload.monthlyPrice !== undefined
      ? { monthly_price: payload.monthlyPrice }
      : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
  };
}

export async function fetchRoomBedspaces(roomId: string, accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >(`/rooms/${roomId}/bedspaces`, {
    headers: authHeaders(accessToken),
  });

  return unwrapCollection(response).map(normalizeBedspace);
}

export async function createBedspace(
  roomId: string,
  payload: BedspacePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/rooms/${roomId}/bedspaces`, toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeBedspace(unwrapData(response));
}

export async function updateBedspace(
  bedspaceId: string,
  payload: Partial<BedspacePayload>,
  accessToken?: string,
) {
  const response = await apiClient.patch<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/bedspaces/${bedspaceId}`, toApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeBedspace(unwrapData(response));
}

export async function deleteBedspace(bedspaceId: string, accessToken?: string) {
  await apiClient.delete(`/bedspaces/${bedspaceId}`, {
    headers: authHeaders(accessToken),
  });
}
