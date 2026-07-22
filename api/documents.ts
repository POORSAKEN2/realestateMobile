import {
  API_BASE_URL,
  apiClient,
  authHeaders,
  unwrapCollection,
  unwrapData,
} from "./client";
import type {
  ApiEnvelope,
  DocumentCategory,
  DocumentUpdatePayload,
  DocumentUpload,
  PropertyDocument,
} from "../types";

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function getStorageUrl(path?: string | null) {
  if (!path?.trim()) return undefined;
  const raw = path.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  const backendOrigin = (API_BASE_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
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

function normalizeDocumentType(type: unknown): PropertyDocument["type"] {
  const rawType = String(type ?? "").toUpperCase();
  if (rawType.includes("DOCX") || rawType.includes("WORD")) return "DOCX";
  if (rawType.includes("PNG")) return "PNG";
  if (
    rawType.includes("JPG") ||
    rawType.includes("JPEG") ||
    rawType.includes("IMAGE")
  )
    return "JPG";
  return "PDF";
}

function normalizeDocument(document: Record<string, any>): PropertyDocument {
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
  return unwrapCollection(response).map(normalizeDocument);
}

function appendOptional(
  formData: FormData,
  key: string,
  value?: string | null,
) {
  if (value !== undefined && value !== null) formData.append(key, value);
}

function appendFile(formData: FormData, document: DocumentUpload) {
  formData.append("file", (document.file ?? document) as unknown as Blob);
}

function toCreateFormData(payload: {
  name: string;
  category: DocumentCategory;
  file: DocumentUpload;
  propertyId?: string;
  lesseeId?: string;
}) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("category", payload.category);
  appendOptional(formData, "property_id", payload.propertyId);
  appendOptional(formData, "lessee_id", payload.lesseeId);
  appendFile(formData, payload.file);
  return formData;
}

function toUpdateFormData(payload: DocumentUpdatePayload) {
  const formData = new FormData();
  formData.append("_method", "PUT");
  appendOptional(formData, "name", payload.name);
  appendOptional(formData, "category", payload.category);
  appendOptional(formData, "property_id", payload.propertyId);
  appendOptional(formData, "lessee_id", payload.lesseeId);
  appendOptional(formData, "revision_comment", payload.revisionComment);
  if (payload.file) appendFile(formData, payload.file);
  return formData;
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
  >("/documents", toCreateFormData(payload), {
    headers: authHeaders(accessToken),
  });
  return normalizeDocument(unwrapData(response));
}

export async function uploadPropertyDocuments(
  propertyId: string,
  documents: DocumentUpload[],
  accessToken?: string,
  category: DocumentCategory = "Compliance",
) {
  return Promise.all(
    documents.map((file) =>
      uploadDocument(
        { propertyId, name: file.name, category, file },
        accessToken,
      ),
    ),
  );
}

export async function updateDocument(
  id: string,
  payload: DocumentUpdatePayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<Record<string, any>> | Record<string, any>
  >(`/documents/${id}`, toUpdateFormData(payload), {
    headers: authHeaders(accessToken),
  });
  return normalizeDocument(unwrapData(response));
}

export async function deleteDocument(id: string, accessToken?: string) {
  await apiClient.delete(`/documents/${id}`, {
    headers: authHeaders(accessToken),
  });
}
