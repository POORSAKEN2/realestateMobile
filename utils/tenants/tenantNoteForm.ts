import type { TenantNote, TenantNoteDraft } from "../../types";

export const TENANT_NOTE_CONTENT_LIMIT = 5_000;

export type TenantNoteFormState = TenantNoteDraft;

export function formatTenantNoteDate(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseTenantNoteDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function createTenantNoteForm(
  note?: TenantNote,
  today = new Date(),
): TenantNoteFormState {
  return {
    content: note?.content ?? "",
    category: note?.category ?? "General",
    date: note?.date ?? formatTenantNoteDate(today),
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  return formatTenantNoteDate(parseTenantNoteDate(value)) === value;
}

export function getTenantNoteFormResult(
  form: TenantNoteFormState,
):
  | { isValid: true; payload: TenantNoteDraft }
  | { error: string; isValid: false } {
  const content = form.content.trim();

  if (!content) {
    return { error: "Enter a note before saving.", isValid: false };
  }
  if (content.length > TENANT_NOTE_CONTENT_LIMIT) {
    return {
      error: `Notes cannot exceed ${TENANT_NOTE_CONTENT_LIMIT.toLocaleString()} characters.`,
      isValid: false,
    };
  }
  if (!isValidDate(form.date)) {
    return { error: "Select a valid note date.", isValid: false };
  }

  return {
    isValid: true,
    payload: {
      category: form.category,
      content,
      date: form.date,
    },
  };
}
