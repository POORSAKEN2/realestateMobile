import { File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { API_BASE_URL, apiClient, authHeaders, unwrapData } from "./client";
import { ApiError, decodeApiErrorPayload, toApiError } from "./errors";
import { getSessionAccess } from "../services/access/sessionAccess";
import {
  assertRequestAccess,
  describeRequest,
  ResourceScopeIndex,
} from "../services/access/requestPolicy";
import type {
  AuditEvent,
  AuditFilters,
  AuditPage,
  AuditRecord,
} from "../types/domain/audit";

function query(filters: AuditFilters, cursor?: string) {
  const values = Object.entries({ ...filters, cursor }).filter(
    ([, value]) => value,
  );
  return values.length
    ? `?${values.map(([key, value]) => `${key}=${encodeURIComponent(value!)}`).join("&")}`
    : "";
}

export async function fetchAuditHistory(
  filters: AuditFilters,
  cursor?: string,
  signal?: AbortSignal,
): Promise<AuditPage> {
  return unwrapData(
    await apiClient.get<AuditPage>(`/audit-events${query(filters, cursor)}`, {
      signal,
    }),
  );
}

export async function fetchAuditEvent(
  id: string,
  signal?: AbortSignal,
): Promise<AuditEvent> {
  return unwrapData(
    await apiClient.get<AuditEvent>(`/audit-events/${encodeURIComponent(id)}`, {
      signal,
    }),
  );
}

export async function fetchAuditRecord(
  id: string,
  signal?: AbortSignal,
): Promise<AuditRecord> {
  return unwrapData(
    await apiClient.get<AuditRecord>(
      `/audit-events/${encodeURIComponent(id)}/record`,
      { signal },
    ),
  );
}

export async function shareAuditHistory(filters: AuditFilters): Promise<void> {
  const session = getSessionAccess();
  const path = `/audit-events/export${query(filters)}`;
  assertRequestAccess(
    session.access,
    describeRequest(path, "GET"),
    new ResourceScopeIndex(),
  );
  if (Platform.OS === "web") {
    const bytes = await apiClient.get<ArrayBuffer>(path, {
      responseType: "arraybuffer",
    });
    const url = URL.createObjectURL(new Blob([bytes], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "Terrane_Audit_History.csv";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  const file = new File(Paths.cache, `Terrane_Audit_History_${Date.now()}.csv`);
  try {
    // Native download streams to disk rather than keeping entire account history in memory.
    const response = await FileSystem.downloadAsync(
      `${API_BASE_URL.replace(/\/$/, "")}${path}`,
      file.uri,
      {
        headers: {
          ...authHeaders(session.token ?? undefined),
          Accept: "text/csv, application/json",
        },
      },
    );
    if (getSessionAccess().revision !== session.revision)
      throw new ApiError(
        "Your account changed. Please try again.",
        409,
        "ACCESS_CHANGED",
      );
    if (response.status >= 400)
      throw toApiError(
        response.status,
        decodeApiErrorPayload(await file.text()),
      );
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
      dialogTitle: "Audit History",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
