import type { PaginatedApiData } from "../../types/api/common";
import type {
  Inquiry,
  InquiryFilters,
  InquiryStatus,
} from "../../types/domain/inquiries";

export const INQUIRY_PAGE_SIZE = 20;

export const INQUIRY_STATUS_OPTIONS: ReadonlyArray<{
  label: string;
  value: InquiryStatus;
}> = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Declined", value: "declined" },
];

type ApiRecord = Record<string, unknown>;

function record(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ApiRecord)
    : {};
}

function text(value: unknown, fallback = "") {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStatus(value: unknown): InquiryStatus {
  const status = text(value).toLowerCase();
  if (status === "contacted") return "contacted";
  if (status === "declined" || status === "closed") return "declined";
  return "new";
}

export function toInquiryApiStatus(status: InquiryStatus) {
  // Current backend names the terminal state `closed`. Keep that legacy
  // vocabulary at the transport boundary while UI follows issue #73.
  return status === "declined" ? "closed" : status;
}

export function normalizeInquiry(value: unknown): Inquiry | null {
  const source = record(value);
  if (text(source.leadType ?? source.lead_type, "inquiry") !== "inquiry") {
    return null;
  }

  const id = text(source.id);
  if (!id) return null;

  const propertySource = record(source.property);
  const listingSource = record(source.listing);
  const propertyId = text(
    source.propertyId ?? source.property_id ?? propertySource.id,
  );
  const propertyTitle = text(
    source.propertyTitle ?? source.property_title ?? propertySource.title,
    "Property",
  );
  const listingId = text(
    source.listingId ?? source.listing_id ?? listingSource.id,
    propertyId,
  );
  const listingTitle = text(
    source.listingTitle ?? source.listing_title ?? listingSource.title,
    propertyTitle,
  );

  return {
    id,
    guest: {
      name: text(source.name ?? record(source.guest).name, "Guest"),
      contact: text(source.contact ?? record(source.guest).contact),
    },
    listing: { id: listingId, title: listingTitle },
    property: { id: propertyId, title: propertyTitle },
    message: text(source.message),
    status: normalizeStatus(source.status),
    createdAt: text(source.createdAt ?? source.created_at),
  };
}

function matchesFilters(inquiry: Inquiry, filters: InquiryFilters) {
  if (
    filters.status &&
    filters.status !== "all" &&
    inquiry.status !== filters.status
  ) {
    return false;
  }
  if (filters.propertyId && inquiry.property.id !== filters.propertyId) {
    return false;
  }

  const query = filters.query?.trim().toLowerCase();
  if (!query) return true;

  return [
    inquiry.guest.name,
    inquiry.guest.contact,
    inquiry.listing.title,
    inquiry.property.title,
    inquiry.message,
  ].some((value) => value.toLowerCase().includes(query));
}

function collectionParts(payload: unknown) {
  const envelope = record(payload);
  const envelopeData = envelope.data;
  const nested = record(envelopeData);
  const nestedRows = Array.isArray(nested.data) ? nested.data : null;
  const directRows = Array.isArray(envelopeData)
    ? envelopeData
    : Array.isArray(payload)
      ? payload
      : [];
  const meta = record(nested.meta);
  const pagination = nestedRows ? { ...nested, ...meta } : {};

  return {
    isServerPaginated: Boolean(nestedRows),
    pagination,
    rows: nestedRows ?? directRows,
  };
}

export function normalizeInquiryPage(
  payload: unknown,
  filters: InquiryFilters,
  requestedPage: number,
  perPage = INQUIRY_PAGE_SIZE,
): PaginatedApiData<Inquiry> {
  const { isServerPaginated, pagination, rows } = collectionParts(payload);
  const inquiries = rows
    .map(normalizeInquiry)
    .filter((item): item is Inquiry => Boolean(item))
    .filter((item) => matchesFilters(item, filters));

  if (isServerPaginated) {
    return {
      data: inquiries,
      current_page: Number(pagination.current_page ?? requestedPage),
      last_page: Number(pagination.last_page ?? requestedPage),
      per_page: Number(pagination.per_page ?? perPage),
      total: Number(pagination.total ?? inquiries.length),
    };
  }

  const safePage = Math.max(1, requestedPage);
  const start = (safePage - 1) * perPage;
  return {
    data: inquiries.slice(start, start + perPage),
    current_page: safePage,
    last_page: Math.max(1, Math.ceil(inquiries.length / perPage)),
    per_page: perPage,
    total: inquiries.length,
  };
}

export function buildInquiryQuery(
  filters: InquiryFilters,
  page: number,
  perPage = INQUIRY_PAGE_SIZE,
) {
  const params = new URLSearchParams({
    lead_type: "inquiry",
    page: String(page),
    per_page: String(perPage),
  });
  const query = filters.query?.trim();
  if (query) params.set("q", query);
  if (filters.propertyId) params.set("property_id", filters.propertyId);
  if (filters.status && filters.status !== "all") {
    params.set("status", toInquiryApiStatus(filters.status));
  }
  return params.toString();
}

export function formatInquiryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
