import { apiClient, authHeaders } from "./client";
import { Share } from "react-native";

export async function downloadFinancialSummaryCsv(
  params?: { start_date?: string; end_date?: string },
  accessToken?: string,
): Promise<string> {
  const queryParts: string[] = [];
  if (params?.start_date) queryParts.push(`start_date=${params.start_date}`);
  if (params?.end_date) queryParts.push(`end_date=${params.end_date}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const response = await apiClient.get<string>(
    `/reports/financial-summary.csv${queryString}`,
    {
      headers: {
        ...authHeaders(accessToken),
        Accept: "text/csv, application/json",
      },
    },
  );

  return typeof response === "string" ? response : JSON.stringify(response);
}

export async function shareFinancialSummaryCsv(
  params?: { start_date?: string; end_date?: string },
  accessToken?: string,
): Promise<void> {
  const csvContent = await downloadFinancialSummaryCsv(params, accessToken);
  await Share.share({
    title: "Terrane_Financial_Summary.csv",
    message: csvContent,
  });
}
