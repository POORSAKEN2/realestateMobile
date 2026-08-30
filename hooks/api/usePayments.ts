import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeaseLedger,
  fetchPayments,
  recordPayment,
  updatePayment,
  type FetchPaymentsParams,
} from "../../api/payments";
import type { RecordPaymentPayload } from "../../types";

export const PAYMENTS_QUERY_KEY = ["payments"] as const;
export const LEASE_LEDGER_QUERY_KEY = ["leaseLedger"] as const;

export function usePayments(params?: FetchPaymentsParams) {
  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, params],
    queryFn: () => fetchPayments(params),
  });
}

export function useLeaseLedger(leaseId: string, enabled = true) {
  return useQuery({
    queryKey: [...LEASE_LEDGER_QUERY_KEY, leaseId],
    queryFn: () => fetchLeaseLedger(leaseId),
    enabled: Boolean(leaseId) && enabled,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RecordPaymentPayload) => recordPayment(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
      if (variables.lease_id) {
        queryClient.invalidateQueries({
          queryKey: [...LEASE_LEDGER_QUERY_KEY, variables.lease_id],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-analytics"] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<RecordPaymentPayload>;
    }) => updatePayment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LEASE_LEDGER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
  });
}
