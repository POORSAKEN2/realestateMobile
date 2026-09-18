import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  auditDate,
  auditFilterErrors,
  auditLabel,
  localAuditDate,
  normalizeAuditFilters,
} = load("../../utils/audit/presentation.ts");

test("audit filters preserve exact action and identity after trimming", () => {
  const id = "12345678-1234-4234-8234-123456789abc";
  const filters = normalizeAuditFilters({
    actor_id: ` ${id} `,
    action: " property.published ",
    entity: "Property",
    result: "",
    search: "  ",
  });
  assert.deepEqual(filters, {
    actor_id: id,
    action: "property.published",
    entity: "Property",
  });
  assert.deepEqual(auditFilterErrors(filters), {});
});

test("audit filters reject incomplete IDs and reversed date ranges", () => {
  assert.ok(
    auditFilterErrors({ actor_id: "12345678", property_id: "bad-id" }).actor_id,
  );
  assert.ok(
    auditFilterErrors({ actor_id: "12345678", property_id: "bad-id" })
      .property_id,
  );
  assert.ok(auditFilterErrors({ start_date: "2026-02-31" }).start_date);
  assert.ok(
    auditFilterErrors({ start_date: "2026-09-19", end_date: "2026-09-18" })
      .end_date,
  );
  assert.deepEqual(
    auditFilterErrors({ start_date: "2026-09-19", end_date: "2026-09-19" }),
    {},
  );
  assert.deepEqual(auditFilterErrors({ end_date: "2024-02-29" }), {});
});

test("audit presentation retains date-only calendar day across time zones", () => {
  const date = new Date(2026, 0, 1, 0, 15);
  assert.equal(localAuditDate(date), "2026-01-01");
  assert.equal(
    auditDate("2026-01-01"),
    new Date(2026, 0, 1, 12).toLocaleDateString(),
  );
  assert.equal(auditDate("invalid"), "Unavailable");
  assert.equal(auditDate(null), "Unavailable");
  assert.equal(
    auditLabel("property.status_changed"),
    "Property status changed",
  );
  assert.equal(auditLabel("DocumentRevision"), "Document Revision");
});
