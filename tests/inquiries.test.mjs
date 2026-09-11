import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  buildInquiryQuery,
  normalizeInquiry,
  normalizeInquiryPage,
  toInquiryApiStatus,
} = load("../../utils/inquiries/inquiryDomain.ts");
const { hasInquiryWorkflowAccess } = load(
  "../../utils/inquiries/inquiryAccess.ts",
);
const { inquiryNotificationRoute, isInquiryNotification } = load(
  "../../utils/inquiries/inquiryNotifications.ts",
);

const inquiry = {
  id: 12,
  leadType: "inquiry",
  propertyId: 9,
  propertyTitle: "Harbor House",
  name: "Ana",
  contact: "ana@example.test",
  message: "Is this available?",
  status: "closed",
  createdAt: "2026-09-11T01:00:00Z",
};

test("legacy lead payload maps into inquiry domain", () => {
  assert.deepEqual(normalizeInquiry(inquiry), {
    id: "12",
    guest: { name: "Ana", contact: "ana@example.test" },
    listing: { id: "9", title: "Harbor House" },
    property: { id: "9", title: "Harbor House" },
    message: "Is this available?",
    status: "declined",
    createdAt: "2026-09-11T01:00:00Z",
  });
  assert.equal(normalizeInquiry({ ...inquiry, leadType: "viewing" }), null);
  assert.equal(toInquiryApiStatus("declined"), "closed");
});

test("unpaginated backend response gains filtered client pagination", () => {
  const rows = Array.from({ length: 25 }, (_, index) => ({
    ...inquiry,
    id: index + 1,
    status: index % 2 ? "new" : "contacted",
  }));
  const page = normalizeInquiryPage({ data: rows }, { status: "new" }, 2, 10);
  assert.equal(page.data.length, 2);
  assert.equal(page.current_page, 2);
  assert.equal(page.last_page, 2);
  assert.equal(page.total, 12);
});

test("server pagination metadata survives normalization", () => {
  const page = normalizeInquiryPage(
    { data: { data: [inquiry], current_page: 2, last_page: 4, total: 61 } },
    {},
    2,
  );
  assert.equal(page.data[0].status, "declined");
  assert.equal(page.current_page, 2);
  assert.equal(page.last_page, 4);
  assert.equal(page.total, 61);
});

test("query builder sends inquiry, search, property, page, and legacy status", () => {
  const params = new URLSearchParams(
    buildInquiryQuery(
      { query: "  Ana  ", propertyId: "9", status: "declined" },
      3,
    ),
  );
  assert.equal(params.get("lead_type"), "inquiry");
  assert.equal(params.get("q"), "Ana");
  assert.equal(params.get("property_id"), "9");
  assert.equal(params.get("status"), "closed");
  assert.equal(params.get("page"), "3");
});

test("inquiry status management follows effective plan", () => {
  assert.equal(hasInquiryWorkflowAccess(), false);
  assert.equal(
    hasInquiryWorkflowAccess({ tier: "tier1", effective_tier: "free" }),
    false,
  );
  assert.equal(hasInquiryWorkflowAccess({ tier: "tier1" }), true);
  assert.equal(hasInquiryWorkflowAccess({ tier: "all_in" }), true);
  assert.equal(
    hasInquiryWorkflowAccess({ tier: "free", gating_enabled: false }),
    true,
  );
});

test("listing lead notifications refresh and route to inquiry UI", () => {
  assert.equal(isInquiryNotification({ type: "listing_lead" }), true);
  assert.equal(
    inquiryNotificationRoute({ type: "LISTING_LEAD", entityId: "12" }),
    "/(secondary)/inquiry-details?inquiryId=12",
  );
  assert.equal(
    inquiryNotificationRoute({ module: "inquiries" }),
    "/(secondary)/inquiries",
  );
  assert.equal(
    inquiryNotificationRoute({ type: "LISTING_LEAD", route: "/properties/9" }),
    null,
  );
  assert.equal(isInquiryNotification({ module: "properties" }), false);
});
