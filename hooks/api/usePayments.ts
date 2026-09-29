import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchLeaseLedger,
  fetchPaymentsPage,
  fetchPaymentOverview,
  collectPayment,
  fetchPayments,
  recordPayment,
  updatePayment,
  type FetchPaymentsParams,
} from "../../api/payments";
import type { CollectPaymentPayload } from "../../types/domain/payments";
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

export function usePaymentOverview() {
  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, "overview"],
    queryFn: fetchPaymentOverview,
  });
}

export function usePaymentPages(params: Omit<FetchPaymentsParams, "page">) {
  return useInfiniteQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, "list", params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchPaymentsPage({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.lastPage
        ? lastPage.currentPage + 1
        : undefined,
  });
}

export function useCollectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CollectPaymentPayload;
    }) => collectPayment(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LEASE_LEDGER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["leases"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-analytics"] }),
      ]);
    },
  });
}
