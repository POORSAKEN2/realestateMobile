import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeTenantNote,
  normalizeTenantNotePage,
} from "../utils/tenants/tenantNoteMapper.ts";

test("normalizes tenant-note snake-case fields", () => {
  assert.deepEqual(
    normalizeTenantNote({
      id: "note-1",
      client_id: "client-1",
      content: "Gate code updated.",
      category: "General",
      date: "2026-08-28T00:00:00.000000Z",
      created_at: "2026-08-28T01:00:00.000000Z",
      updated_at: "2026-08-28T02:00:00.000000Z",
    }),
    {
      id: "note-1",
      clientId: "client-1",
      content: "Gate code updated.",
      category: "General",
      date: "2026-08-28",
      createdAt: "2026-08-28T01:00:00.000000Z",
      updatedAt: "2026-08-28T02:00:00.000000Z",
    },
  );
});

test("preserves Laravel resource pagination metadata", () => {
  const page = normalizeTenantNotePage({
    data: [
      {
        id: "note-1",
        client_id: "client-1",
        content: "Gate code updated.",
        category: "Financial",
        date: "2026-08-28",
      },
    ],
    meta: {
      current_page: 2,
      last_page: 3,
      per_page: 15,
      total: 31,
    },
  });

  assert.equal(page.data[0].clientId, "client-1");
  assert.equal(page.currentPage, 2);
  assert.equal(page.lastPage, 3);
  assert.equal(page.perPage, 15);
  assert.equal(page.total, 31);
});

test("falls back safely for an unknown backend category", () => {
  assert.equal(
    normalizeTenantNote({ category: "Unknown" }).category,
    "General",
  );
});
