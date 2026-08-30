import { apiClient, authHeaders, unwrapData } from "./client";
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
}

export async function fetchPayments(
  params?: FetchPaymentsParams,
  accessToken?: string,
): Promise<Payment[]> {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.property_id) queryParts.push(`property_id=${encodeURIComponent(params.property_id)}`);
  if (params?.lease_id) queryParts.push(`lease_id=${encodeURIComponent(params.lease_id)}`);
  if (params?.page) queryParts.push(`page=${params.page}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const response = await apiClient.get<ApiEnvelope<Payment[]> | Payment[]>(
    `/payments${queryString}`,
    { headers: authHeaders(accessToken) },
  );

  const raw = unwrapData<Payment[]>(response);
  return Array.isArray(raw) ? raw : [];
}

export async function fetchLeaseLedger(
  leaseId: string,
  accessToken?: string,
): Promise<LeaseLedgerData> {
  const response = await apiClient.get<ApiEnvelope<LeaseLedgerData> | LeaseLedgerData>(
    `/leases/${leaseId}/ledger`,
    { headers: authHeaders(accessToken) },
  );

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
