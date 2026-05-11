import { apiClient } from "./client";

type ApiEnvelope<T> = {
  data?: T;
};

export type Lessee = {
  id: string;
  tenantId?: string;
  name: string;
  contactEmail: string;
  phone: string;
};

export type Lease = {
  id: string;
  propertyId: string;
  lesseeId: string;
  roomNumber?: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: "Active" | "Expired" | "Terminated" | string;
  lessee?: Lessee;
};

export type PropertyDocument = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "JPG" | "PNG";
  category: "Leases" | "Compliance" | "Maintenance" | "Contracts" | string;
  size: string;
  date: string;
  propertyId?: string;
  lesseeId?: string;
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

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeCollection<T>(payload: ApiEnvelope<T[]> | T[]): T[] {
  const data = unwrapData(payload);

  return Array.isArray(data) ? data : [];
}

const normalizeLessee = (lessee: Record<string, any>): Lessee => ({
  ...lessee,
  id: String(lessee?.lesseeId ?? lessee?.lessee_id ?? lessee?.id ?? ""),
  tenantId: String(
    lessee?.tenantId ??
      lessee?.tenant_id ??
      lessee?.id ??
      lessee?.lessee_id ??
      "",
  ),
  name: String(lessee?.name ?? "Linked tenant"),
  contactEmail: String(
    lessee?.contactEmail ?? lessee?.contact_email ?? lessee?.domain ?? "",
  ),
  phone: String(lessee?.phone ?? lessee?.contact_number ?? ""),
});

const normalizeLease = (lease: Record<string, any>): Lease => ({
  ...lease,
  id: String(lease?.id ?? ""),
  propertyId: String(lease?.propertyId ?? lease?.property_id ?? ""),
  lesseeId: String(lease?.lesseeId ?? lease?.lessee_id ?? ""),
  roomNumber: lease?.roomNumber ?? lease?.room_number ?? null,
  startDate: formatDate(lease?.startDate ?? lease?.start_date ?? ""),
  endDate: formatDate(lease?.endDate ?? lease?.end_date ?? ""),
  monthlyRent: Number(lease?.monthlyRent ?? lease?.monthly_rent ?? 0),
  status: lease?.status ?? "Active",
  lessee: lease?.lessee ? normalizeLessee(lease.lessee) : undefined,
});

const normalizeDocumentType = (type: unknown): PropertyDocument["type"] => {
  const rawType = String(type ?? "").toUpperCase();

  if (rawType.includes("DOCX") || rawType.includes("WORD")) return "DOCX";
  if (rawType.includes("PNG")) return "PNG";
  if (rawType.includes("JPG") || rawType.includes("JPEG") || rawType.includes("IMAGE")) {
    return "JPG";
  }

  return "PDF";
};

const normalizeDocument = (document: Record<string, any>): PropertyDocument => {
  const media = Array.isArray(document?.media) ? document.media[0] : undefined;

  return {
    ...document,
    id: String(document?.id ?? ""),
    name: String(document?.name ?? document?.file_name ?? "Untitled document"),
    type: normalizeDocumentType(document?.type ?? media?.mime_type),
    category: String(document?.category ?? "Compliance"),
    size: String(document?.size ?? media?.size ?? "N/A"),
    date: formatDate(document?.date ?? document?.created_at ?? ""),
    propertyId: document?.propertyId ?? document?.property_id ?? undefined,
    lesseeId: document?.lesseeId ?? document?.lessee_id ?? undefined,
  };
};

export async function fetchLeases(accessToken?: string) {
  const response = await apiClient.get<ApiEnvelope<Record<string, any>[]> | Record<string, any>[]>(
    "/leases",
    { headers: authHeaders(accessToken) },
  );

  return normalizeCollection(response).map(normalizeLease);
}

export async function fetchLessees(accessToken?: string) {
  const response = await apiClient.get<ApiEnvelope<Record<string, any>[]> | Record<string, any>[]>(
    "/lessees",
    { headers: authHeaders(accessToken) },
  );

  return normalizeCollection(response).map(normalizeLessee);
}

export async function fetchDocuments(
  accessToken?: string,
  params?: { propertyId?: string },
) {
  const query = params?.propertyId
    ? `?property_id=${encodeURIComponent(params.propertyId)}`
    : "";
  const response = await apiClient.get<ApiEnvelope<Record<string, any>[]> | Record<string, any>[]>(
    `/documents${query}`,
    { headers: authHeaders(accessToken) },
  );

  return normalizeCollection(response).map(normalizeDocument);
}
