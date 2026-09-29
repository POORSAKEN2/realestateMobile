import { apiClient, authHeaders, unwrapData } from "./client";
import type {
  PaymentBucket,
  PaymentOverview,
  PaymentPage,
  CollectPaymentPayload,
} from "../types/domain/payments";
import type {
  ApiEnvelope,
  LeaseLedgerData,
  Payment,
  PaymentStatus,
  RecordPaymentPayload,
} from "../types";

export interface FetchPaymentsParams {
  status?: PaymentStatus;
  property_id?: string;
  lease_id?: string;
  page?: number;
  bucket?: PaymentBucket;
  search?: string;
}

export async function fetchPaymentsPage(
  params: FetchPaymentsParams = {},
  accessToken?: string,
): Promise<PaymentPage> {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
  const response = await apiClient.get<{
    data: Payment[];
    meta: { current_page: number; last_page: number };
  }>(`/payments${query ? `?${query}` : ""}`, {
    headers: authHeaders(accessToken),
  });
  if (
    !Array.isArray(response.data) ||
    !response.meta?.current_page ||
    !response.meta?.last_page
  ) {
    throw new Error(
      "Payment list is temporarily unavailable. Please try again later.",
    );
  }
  return {
    items: response.data,
    currentPage: response.meta.current_page,
    lastPage: response.meta.last_page,
  };
}

export async function fetchPayments(
  params?: FetchPaymentsParams,
  accessToken?: string,
): Promise<Payment[]> {
  return (await fetchPaymentsPage(params, accessToken)).items;
}

export async function fetchPaymentOverview(): Promise<PaymentOverview> {
  return unwrapData(
    await apiClient.get<ApiEnvelope<PaymentOverview>>("/payments/overview"),
  );
}

export async function collectPayment(
  id: string,
  payload: CollectPaymentPayload,
): Promise<Payment> {
  return unwrapData(
    await apiClient.post<ApiEnvelope<Payment>>(
      `/payments/${encodeURIComponent(id)}/collect`,
      payload,
    ),
  );
}

export async function fetchLeaseLedger(
  leaseId: string,
  accessToken?: string,
): Promise<LeaseLedgerData> {
  const response = await apiClient.get<
    ApiEnvelope<LeaseLedgerData> | LeaseLedgerData
  >(`/leases/${leaseId}/ledger`, { headers: authHeaders(accessToken) });

  return unwrapData<LeaseLedgerData>(response);
}

export async function recordPayment(
  payload: RecordPaymentPayload,
  accessToken?: string,
): Promise<Payment> {
  const response = await apiClient.post<ApiEnvelope<Payment> | Payment>(
    "/payments",
    payload,
    { headers: authHeaders(accessToken) },
  );

  return unwrapData<Payment>(response);
}

export async function updatePayment(
  id: string,
  payload: Partial<RecordPaymentPayload>,
  accessToken?: string,
): Promise<Payment> {
  const response = await apiClient.put<ApiEnvelope<Payment> | Payment>(
    `/payments/${id}`,
    payload,
    { headers: authHeaders(accessToken) },
  );

  return unwrapData<Payment>(response);
}
