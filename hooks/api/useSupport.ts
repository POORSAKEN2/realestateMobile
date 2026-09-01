import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupportTicket,
  fetchFaqs,
  fetchSupportTickets,
} from "../../api/support";
import type { CreateSupportTicketPayload } from "../../types/domain/support";

export const FAQS_QUERY_KEY = ["faqs"] as const;
export const SUPPORT_TICKETS_QUERY_KEY = ["supportTickets"] as const;

export function useFaqs() {
  return useQuery({
    queryKey: FAQS_QUERY_KEY,
    queryFn: () => fetchFaqs(),
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: SUPPORT_TICKETS_QUERY_KEY,
    queryFn: () => fetchSupportTickets(),
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) => createSupportTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_QUERY_KEY });
    },
  });
}
