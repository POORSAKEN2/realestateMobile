import { apiClient, authHeaders, unwrapCollection, unwrapData } from "./client";
import type { ApiEnvelope, PaginatedApiData } from "../types";
import type {
  CreateSupportTicketPayload,
  FAQItem,
  SupportTicket,
} from "../types/domain/support";

export async function fetchFaqs(accessToken?: string): Promise<FAQItem[]> {
  const response = await apiClient.get<
    ApiEnvelope<FAQItem[]> | ApiEnvelope<PaginatedApiData<FAQItem>> | FAQItem[]
  >("/faqs", { headers: authHeaders(accessToken) });

  return unwrapCollection<FAQItem>(response);
}

export async function fetchSupportTickets(
  accessToken?: string,
): Promise<SupportTicket[]> {
  const response = await apiClient.get<
    | ApiEnvelope<SupportTicket[]>
    | ApiEnvelope<PaginatedApiData<SupportTicket>>
    | SupportTicket[]
  >("/support-tickets", { headers: authHeaders(accessToken) });

  return unwrapCollection<SupportTicket>(response);
}

export async function createSupportTicket(
  payload: CreateSupportTicketPayload,
  accessToken?: string,
): Promise<SupportTicket> {
  const response = await apiClient.post<
    ApiEnvelope<SupportTicket> | SupportTicket
  >("/support-tickets", payload, {
    headers: authHeaders(accessToken),
  });

  return unwrapData<SupportTicket>(response);
}

export async function fetchSupportTicket(
  id: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SupportTicket> {
  const response = await apiClient.get<
    ApiEnvelope<SupportTicket> | SupportTicket
  >(`/support-tickets/${encodeURIComponent(id)}`, {
    headers: authHeaders(accessToken),
    signal,
  });
  return unwrapData<SupportTicket>(response);
}
