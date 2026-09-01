import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope } from "../types";
import type {
  ListingLead,
  ListingLeadStatus,
  UpdateLeadStatusPayload,
} from "../types/domain/leads";

export async function fetchLeads(
  params?: { status?: ListingLeadStatus; property_id?: string },
  accessToken?: string,
): Promise<ListingLead[]> {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.property_id) queryParts.push(`property_id=${encodeURIComponent(params.property_id)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const response = await apiClient.get<ApiEnvelope<ListingLead[]> | ListingLead[]>(
    `/leads${queryString}`,
    { headers: authHeaders(accessToken) },
  );

  const raw = unwrapData<ListingLead[]>(response);
  return Array.isArray(raw) ? raw : [];
}

export async function updateLeadStatus(
  payload: UpdateLeadStatusPayload,
  accessToken?: string,
): Promise<ListingLead> {
  const endpoint =
    payload.leadType === "viewing"
      ? `/leads/viewings/${payload.id}/status`
      : `/leads/inquiries/${payload.id}/status`;

  const response = await apiClient.patch<ApiEnvelope<ListingLead> | ListingLead>(
    endpoint,
    { status: payload.status },
    { headers: authHeaders(accessToken) },
  );

  return unwrapData<ListingLead>(response);
}
