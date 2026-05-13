import { apiClient } from "./client";
import type { ApiEnvelope, PortfolioSnapshot, PortfolioStats } from "../types";

export type { PortfolioSnapshot, PortfolioStats } from "../types";

function authHeaders(accessToken?: string) {
  return {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function unwrapData<T>(response: ApiEnvelope<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    response.data !== undefined
  ) {
    return response.data;
  }

  return response as T;
}

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
