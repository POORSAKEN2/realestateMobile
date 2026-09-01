import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope } from "../types";
import type { GlobalSearchResults } from "../types/domain/search";

export async function searchGlobal(
  query: string,
  accessToken?: string,
): Promise<GlobalSearchResults> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return {
      query: trimmed,
      properties: [],
      leases: [],
      clients: [],
      expenses: [],
      documents: [],
      bookings: [],
    };
  }

  const response = await apiClient.get<
    ApiEnvelope<GlobalSearchResults> | GlobalSearchResults
  >(`/search?q=${encodeURIComponent(trimmed)}`, {
    headers: authHeaders(accessToken),
  });

  return unwrapData<GlobalSearchResults>(response);
}
