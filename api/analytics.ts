import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope, PortfolioSnapshot, PortfolioStats } from "../types";

export type { PortfolioSnapshot, PortfolioStats } from "../types";

export async function fetchPortfolioStats(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<PortfolioStats> | PortfolioStats
  >("/analytics/stats", { headers: authHeaders(accessToken) });

  return unwrapData<PortfolioStats>(response);
}

export async function fetchPortfolioHistory(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<PortfolioSnapshot[]> | PortfolioSnapshot[]
  >("/analytics/history", { headers: authHeaders(accessToken) });

  return unwrapData<PortfolioSnapshot[]>(response);
}
