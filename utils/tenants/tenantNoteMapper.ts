import type {
  TenantNote,
  TenantNoteCategory,
  TenantNotePage,
} from "../../types/domain/tenantNotes";

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCategory(value: unknown): TenantNoteCategory {
  switch (value) {
    case "Behavior":
    case "Financial":
    case "General":
    case "Maintenance":
      return value;
    default:
      return "General";
  }
}

export function normalizeTenantNote(value: Record<string, any>): TenantNote {
  return {
    id: String(value?.id ?? ""),
    clientId: String(value?.clientId ?? value?.client_id ?? ""),
    content: String(value?.content ?? ""),
    category: normalizeCategory(value?.category),
    date: String(value?.date ?? "").slice(0, 10),
    createdAt: value?.createdAt ?? value?.created_at ?? undefined,
    updatedAt: value?.updatedAt ?? value?.updated_at ?? undefined,
  };
}

export function normalizeTenantNotePage(payload: unknown): TenantNotePage {
  const envelope = isRecord(payload) ? payload : {};
  const nested = isRecord(envelope.data) ? envelope.data : null;
  const page = nested && Array.isArray(nested.data) ? nested : envelope;
  const meta = isRecord(page.meta) ? page.meta : page;
  const rawNotes = Array.isArray(page.data) ? page.data : [];

  return {
    data: rawNotes.filter(isRecord).map(normalizeTenantNote),
    currentPage: Number(meta.current_page ?? 1),
    lastPage: Number(meta.last_page ?? 1),
    perPage: Number(meta.per_page ?? rawNotes.length),
    total: Number(meta.total ?? rawNotes.length),
  };
}
