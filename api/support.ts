import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope } from "../types";
import type {
  CreateSupportTicketPayload,
  FAQItem,
  SupportTicket,
} from "../types/domain/support";

export async function fetchFaqs(accessToken?: string): Promise<FAQItem[]> {
  const response = await apiClient.get<ApiEnvelope<FAQItem[]> | FAQItem[]>(
    "/faqs",
    { headers: authHeaders(accessToken) },
  );

  const raw = unwrapData<FAQItem[]>(response);
  return Array.isArray(raw) ? raw : [];
}

export async function fetchSupportTickets(
  accessToken?: string,
): Promise<SupportTicket[]> {
  const response = await apiClient.get<
    ApiEnvelope<SupportTicket[]> | { data?: SupportTicket[] } | SupportTicket[]
  >("/support-tickets", { headers: authHeaders(accessToken) });

  const raw = unwrapData<SupportTicket[]>(response);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray((raw as any).data)) {
    return (raw as any).data;
  }
  return [];
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
