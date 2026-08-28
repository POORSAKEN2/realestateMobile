import assert from "node:assert/strict";
import test from "node:test";

import { getSelectableTenantDocuments } from "../utils/tenants/tenantDocumentSelection.ts";
import { tenantDetailsViewReducer } from "../utils/tenants/tenantDetailsView.ts";

const documents = [
  {
    id: "available",
    name: "Signed Lease",
    category: "Contracts",
    type: "PDF",
    size: "500 KB",
  },
  {
    id: "assigned",
    name: "Tenant ID",
    category: "Compliance",
    type: "JPG",
    size: "1 MB",
    lesseeId: "another-tenant",
  },
  {
    id: "maintenance",
    name: "Repair Photo",
    category: "Maintenance",
    type: "PNG",
    size: "75 KB",
  },
];

test("only returns documents not assigned to a tenant", () => {
  assert.deepEqual(
    getSelectableTenantDocuments(documents).map(({ id }) => id),
    ["available", "maintenance"],
  );
});

test("searches document metadata case-insensitively", () => {
  assert.deepEqual(
    getSelectableTenantDocuments(documents, "contract").map(({ id }) => id),
    ["available"],
  );
  assert.deepEqual(
    getSelectableTenantDocuments(documents, "png").map(({ id }) => id),
    ["maintenance"],
  );
});

test("Select opens the document selector and close returns to details", () => {
  const selectorView = tenantDetailsViewReducer("details", {
    type: "open-document-selector",
  });
  assert.equal(selectorView, "document-selector");
  assert.equal(
    tenantDetailsViewReducer(selectorView, { type: "show-details" }),
    "details",
  );
});

test("Add note opens the editor and close returns to details", () => {
  const editorView = tenantDetailsViewReducer("details", {
    type: "open-note-editor",
  });
  assert.equal(editorView, "note-editor");
  assert.equal(
    tenantDetailsViewReducer(editorView, { type: "show-details" }),
    "details",
  );
});
