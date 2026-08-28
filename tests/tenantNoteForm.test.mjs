import assert from "node:assert/strict";
import test from "node:test";

import {
  createTenantNoteForm,
  getTenantNoteFormResult,
  TENANT_NOTE_CONTENT_LIMIT,
} from "../utils/tenants/tenantNoteForm.ts";

test("creates a note form with a local calendar date", () => {
  assert.deepEqual(
    createTenantNoteForm(undefined, new Date(2026, 7, 28, 23, 30)),
    {
      category: "General",
      content: "",
      date: "2026-08-28",
    },
  );
});

test("normalizes valid note content before submission", () => {
  assert.deepEqual(
    getTenantNoteFormResult({
      category: "Maintenance",
      content: "  Replacement key issued.  ",
      date: "2026-08-28",
    }),
    {
      isValid: true,
      payload: {
        category: "Maintenance",
        content: "Replacement key issued.",
        date: "2026-08-28",
      },
    },
  );
});

test("rejects empty, oversized, and invalid-date notes", () => {
  assert.equal(
    getTenantNoteFormResult({
      category: "General",
      content: "   ",
      date: "2026-08-28",
    }).isValid,
    false,
  );
  assert.equal(
    getTenantNoteFormResult({
      category: "General",
      content: "x".repeat(TENANT_NOTE_CONTENT_LIMIT + 1),
      date: "2026-08-28",
    }).isValid,
    false,
  );
  assert.equal(
    getTenantNoteFormResult({
      category: "General",
      content: "Valid content",
      date: "2026-02-30",
    }).isValid,
    false,
  );
});
