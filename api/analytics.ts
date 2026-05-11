import { apiClient } from "./client";

type ApiEnvelope<T> = {
  data?: T;
};

export type PortfolioStats = {
  total_value: number;
  avg_yield: number;
  occupancy_rate: number;
  total_properties: number;
  total_arrears?: number;
  total_revenue?: number;
  total_expenses?: number;
  net_operating_income?: number;
};

export type PortfolioSnapshot = {
  id: string;
  tenant_id?: string;
  snapshot_date: string;
  total_value: number;
  avg_yield: number;
  occupancy_rate: number;
  total_arrears: number;
  net_operating_income: number;
};

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
  const response = await apiClient.get<ApiEnvelope<PortfolioStats> | PortfolioStats>(
    "/analytics/stats",
    { headers: authHeaders(accessToken) },
  );

  return unwrapData<PortfolioStats>(response);
}

export async function fetchPortfolioHistory(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<PortfolioSnapshot[]> | PortfolioSnapshot[]
  >("/analytics/history", { headers: authHeaders(accessToken) });

  return unwrapData<PortfolioSnapshot[]>(response);
}
