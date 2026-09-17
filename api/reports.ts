import { apiClient, authHeaders } from "./client";
import { Platform, Share } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

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

export async function shareFinancialSummaryPdf(
  params?: { start_date?: string; end_date?: string },
  accessToken?: string,
): Promise<void> {
  const query = Object.entries(params ?? {}).filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join("&");
  const bytes = await apiClient.get<ArrayBuffer>(`/reports/financial-summary.pdf${query ? `?${query}` : ""}`, {
    headers: { ...authHeaders(accessToken), Accept: "application/pdf, application/json" },
    responseType: "arraybuffer",
  });
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Terrane_Financial_Summary.pdf";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error("File sharing is unavailable on this device.");
  const file = new File(Paths.cache, `Terrane_Financial_Summary_${Date.now()}.pdf`);
  try {
    file.create();
    file.write(new Uint8Array(bytes));
    await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Financial Summary" });
  } finally {
    if (file.exists) file.delete();
  }
}
