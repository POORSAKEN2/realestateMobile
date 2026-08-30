import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLeads, updateLeadStatus } from "../../api/leads";
import type {
  ListingLeadStatus,
  UpdateLeadStatusPayload,
} from "../../types/domain/leads";

export const LEADS_QUERY_KEY = ["leads"] as const;

export function useLeads(params?: { status?: ListingLeadStatus; property_id?: string }) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, params],
    queryFn: () => fetchLeads(params),
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLeadStatusPayload) => updateLeadStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });
}
