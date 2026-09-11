import { ApiError } from "./errors";
import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope, PaginatedApiData } from "../types";
import type {
  Inquiry,
  InquiryFilters,
  UpdateInquiryStatusPayload,
} from "../types/domain/inquiries";
import {
  buildInquiryQuery,
  normalizeInquiry,
  normalizeInquiryPage,
  toInquiryApiStatus,
} from "../utils/inquiries/inquiryDomain";

export async function fetchInquiryPage(
  filters: InquiryFilters,
  page: number,
  accessToken?: string,
): Promise<PaginatedApiData<Inquiry>> {
  const response = await apiClient.get<unknown>(
    `/leads?${buildInquiryQuery(filters, page)}`,
    { headers: authHeaders(accessToken) },
  );
  return normalizeInquiryPage(response, filters, page);
}

export async function fetchInquiry(id: string, accessToken?: string) {
  // Collection lookup supports current backend and seeds assigned-property
  // scope before a manager opens a deep-linked detail view.
  const response = await apiClient.get<unknown>(
    `/leads?lead_type=inquiry&inquiry_id=${encodeURIComponent(id)}`,
    { headers: authHeaders(accessToken) },
  );
  const page = normalizeInquiryPage(response, {}, 1, Number.MAX_SAFE_INTEGER);
  const inquiry = page.data?.find((item) => item.id === id);
  if (!inquiry) throw new ApiError("Inquiry could not be found.", 404);
  return inquiry;
}

export async function updateInquiryStatus(
  payload: UpdateInquiryStatusPayload,
  accessToken?: string,
) {
  const response = await apiClient.patch<ApiEnvelope<unknown> | unknown>(
    `/leads/inquiries/${encodeURIComponent(payload.id)}/status`,
    { status: toInquiryApiStatus(payload.status) },
    { headers: authHeaders(accessToken) },
  );
  const inquiry = normalizeInquiry(unwrapData(response));
  if (!inquiry) throw new Error("API returned an invalid inquiry.");
  return inquiry;
}
