import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupportTicket,
  fetchFaqs,
  fetchSupportTickets,
  fetchSupportTicket,
} from "../../api/support";
import type {
  CreateSupportTicketPayload,
  SupportTicket,
} from "../../types/domain/support";
import { isTicketUnavailable } from "../../utils/support/ticketDetails";

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

export function useSupportTicket(ticket: SupportTicket | null) {
  const queryClient = useQueryClient();
  const id = ticket?.id;
  const query = useQuery({
    queryKey: [...SUPPORT_TICKETS_QUERY_KEY, "detail", id],
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    placeholderData: ticket ?? undefined,
    retry: (count, error) => !isTicketUnavailable(error) && count < 1,
    queryFn: async ({ signal }) => {
      if (!id) throw new Error("Select a ticket first.");
      const fresh = await fetchSupportTicket(id, undefined, signal);
      queryClient.setQueryData<SupportTicket[]>(
        SUPPORT_TICKETS_QUERY_KEY,
        (current) => current?.map((item) => (item.id === id ? fresh : item)),
      );
      return fresh;
    },
  });

  useEffect(() => {
    if (!id || !isTicketUnavailable(query.error)) return;
    queryClient
      .getQueryCache()
      .find({
        queryKey: [...SUPPORT_TICKETS_QUERY_KEY, "detail", id],
        exact: true,
      })
      ?.setState({ data: undefined });
    void queryClient.invalidateQueries({
      queryKey: SUPPORT_TICKETS_QUERY_KEY,
      exact: true,
    });
  }, [id, query.error, queryClient]);

  return query;
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) =>
      createSupportTicket(payload),
    onSuccess: (ticket) => {
      queryClient.setQueryData<SupportTicket[]>(
        SUPPORT_TICKETS_QUERY_KEY,
        (current) => [
          ticket,
          ...(current ?? []).filter((item) => item.id !== ticket.id),
        ],
      );
      queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_QUERY_KEY });
    },
  });
}
