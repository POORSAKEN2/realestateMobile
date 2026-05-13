import { API_BASE_URL, apiClient } from "./client";

type ApiEnvelope<T> = {
  data?: T;
};

type PaginatedApiData<T> = {
  data?: T[];
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
  url?: string;
  mimeType?: string;
  propertyId?: string;
  lesseeId?: string;
};

export type DocumentUpload = {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file?: Blob;
};

export type DocumentCategory =
  | "Leases"
  | "Compliance"
  | "Maintenance"
  | "Contracts";

export type DocumentUpdatePayload = {
  name?: string;
  category?: DocumentCategory;
  propertyId?: string | null;
  lesseeId?: string | null;
  file?: DocumentUpload;
  revisionComment?: string;
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

function normalizeCollection<T>(
  payload: ApiEnvelope<T[]> | ApiEnvelope<PaginatedApiData<T>> | T[],
): T[] {
  const data =
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
      ? payload.data
      : payload;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as PaginatedApiData<T>).data)
  ) {
    return (data as PaginatedApiData<T>).data ?? [];
  }

  return [];
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
  startDate: String(lease?.startDate ?? lease?.start_date ?? "").slice(0, 10),
  endDate: String(lease?.endDate ?? lease?.end_date ?? "").slice(0, 10),
  monthlyRent: Number(lease?.monthlyRent ?? lease?.monthly_rent ?? 0),
  status: lease?.status ?? "Active",
  lessee: lease?.lessee ? normalizeLessee(lease.lessee) : undefined,
});

const normalizeDocumentType = (type: unknown): PropertyDocument["type"] => {
  const rawType = String(type ?? "").toUpperCase();

  if (rawType.includes("DOCX") || rawType.includes("WORD")) return "DOCX";
  if (rawType.includes("PNG")) return "PNG";
  if (
    rawType.includes("JPG") ||
    rawType.includes("JPEG") ||
    rawType.includes("IMAGE")
  ) {
    return "JPG";
  }

  return "PDF";
};

function getStorageUrl(path?: string | null) {
  if (!path) return undefined;

  const raw = path.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiUrl = API_BASE_URL || "http://localhost:8000/api";
  const backendOrigin = apiUrl.replace(/\/api\/?$/, "");

  if (raw.startsWith("/storage/")) return `${backendOrigin}${raw}`;
  if (raw.startsWith("storage/")) return `${backendOrigin}/${raw}`;

  return `${backendOrigin}/storage/${raw.replace(/^\/+/, "")}`;
}

function formatFileSize(value: unknown) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) return "N/A";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;

  return `${bytes} B`;
}

const normalizeDocument = (document: Record<string, any>): PropertyDocument => {
  const media = Array.isArray(document?.media) ? document.media[0] : undefined;
  const rawUrl =
    document?.url ??
    document?.file_url ??
    document?.fileUrl ??
    document?.path ??
    document?.file_path ??
    media?.original_url ??
    media?.url ??
    media?.preview_url;
  const mimeType = String(
    document?.mimeType ?? document?.mime_type ?? media?.mime_type ?? "",
  );

  return {
    ...document,
    id: String(document?.id ?? ""),
    name: String(document?.name ?? document?.file_name ?? "Untitled document"),
    type: normalizeDocumentType(document?.type ?? mimeType),
    category: String(document?.category ?? "Compliance"),
    size:
      typeof document?.size === "string"
        ? document.size
        : formatFileSize(document?.size ?? media?.size),
    date: formatDate(document?.date ?? document?.created_at ?? ""),
    url: getStorageUrl(rawUrl),
    mimeType: mimeType || undefined,
    propertyId: document?.propertyId ?? document?.property_id ?? undefined,
    lesseeId: document?.lesseeId ?? document?.lessee_id ?? undefined,
  };
};

export async function fetchLeases(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/leases", { headers: authHeaders(accessToken) });

  return normalizeCollection(response).map(normalizeLease);
}

export type LeasePayload = {
  propertyId: string;
  lesseeId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  roomNumber?: string;
  status?: string;
};

function toLeaseApiPayload(payload: LeasePayload) {
  return {
    property_id: payload.propertyId,
    lessee_id: payload.lesseeId,
    start_date: payload.startDate,
    end_date: payload.endDate,
    monthly_rent: payload.monthlyRent,
    room_number: payload.roomNumber || undefined,
    status: payload.status || "Active",
  };
}

export async function createLease(payload: LeasePayload, accessToken?: string) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/leases", toLeaseApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeLease(unwrapData(response));
}

export async function updateLease(
  id: string,
  payload: LeasePayload,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/leases/${id}`, toLeaseApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeLease(unwrapData(response));
}

export async function deleteLease(id: string, accessToken?: string) {
  await apiClient.delete(`/leases/${id}`, {
    headers: authHeaders(accessToken),
  });
}

export async function fetchLessees(accessToken?: string) {
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >("/lessees", { headers: authHeaders(accessToken) });

  return normalizeCollection(response).map(normalizeLessee);
}

export type LesseePayload = {
  name: string;
  contactEmail: string;
  phone: string;
};

function toLesseeApiPayload(payload: LesseePayload) {
  return {
    name: payload.name,
    contact_email: payload.contactEmail,
    phone: payload.phone,
  };
}

export async function createLessee(
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/lessees", toLesseeApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeLessee(unwrapData(response));
}

export async function updateLessee(
  id: string,
  payload: LesseePayload,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/lessees/${id}`, toLesseeApiPayload(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeLessee(unwrapData(response));
}

export async function deleteLessee(id: string, accessToken?: string) {
  await apiClient.delete(`/lessees/${id}`, {
    headers: authHeaders(accessToken),
  });
}

export async function fetchDocuments(
  accessToken?: string,
  params?: { propertyId?: string },
) {
  const query = params?.propertyId
    ? `?property_id=${encodeURIComponent(params.propertyId)}`
    : "";
  const response = await apiClient.get<
    ApiEnvelope<Record<string, any>[]> | Record<string, any>[]
  >(`/documents${query}`, { headers: authHeaders(accessToken) });

  return normalizeCollection(response).map(normalizeDocument);
}

export async function uploadPropertyDocuments(
  propertyId: string,
  documents: DocumentUpload[],
  accessToken?: string,
  category: DocumentCategory = "Compliance",
) {
  if (documents.length === 0) return [];

  const uploadedDocuments = await Promise.all(
    documents.map((document) =>
      uploadDocument(
        {
          propertyId,
          name: document.name,
          category,
          file: document,
        },
        accessToken,
      ),
    ),
  );

  return uploadedDocuments;
}

export async function uploadDocument(
  payload: {
    name: string;
    category: DocumentCategory;
    file: DocumentUpload;
    propertyId?: string;
    lesseeId?: string;
  },
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >("/documents", toDocumentFormData(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeDocument(unwrapData(response));
}

export async function updateDocument(
  id: string,
  payload: DocumentUpdatePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/documents/${id}`, toDocumentUpdateFormData(payload), {
    headers: authHeaders(accessToken),
  });

  return normalizeDocument(unwrapData(response));
}

function appendOptionalFormValue(
  formData: FormData,
  key: string,
  value?: string | null,
) {
  if (value === undefined || value === null) return;
  formData.append(key, value);
}

function appendDocumentFile(formData: FormData, document: DocumentUpload) {
  formData.append("file", (document.file ?? document) as unknown as Blob);
}

function toDocumentFormData(payload: {
  name: string;
  category: DocumentCategory;
  file: DocumentUpload;
  propertyId?: string;
  lesseeId?: string;
}) {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("category", payload.category);
  appendOptionalFormValue(formData, "property_id", payload.propertyId);
  appendOptionalFormValue(formData, "lessee_id", payload.lesseeId);
  appendDocumentFile(formData, payload.file);

  return formData;
}

function toDocumentUpdateFormData(payload: DocumentUpdatePayload) {
  const formData = new FormData();

  formData.append("_method", "PUT");
  appendOptionalFormValue(formData, "name", payload.name);
  appendOptionalFormValue(formData, "category", payload.category);
  appendOptionalFormValue(formData, "property_id", payload.propertyId);
  appendOptionalFormValue(formData, "lessee_id", payload.lesseeId);
  appendOptionalFormValue(
    formData,
    "revision_comment",
    payload.revisionComment,
  );
  if (payload.file) appendDocumentFile(formData, payload.file);

  return formData;
}
