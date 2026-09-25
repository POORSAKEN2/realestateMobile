import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchExpenseActivity,
  retireExpenseReceipt,
  transitionExpense,
  uploadExpenseReceipts,
} from "../../api/expenses";
import type { ExpenseLifecycleStatus } from "../../types/domain/expenses";
import { expenseKeys, useExpenses } from "../api/useExpenses";
import { useAuth } from "../useAuth";

export function useExpenseGovernance(
  expenseId: string | null,
  enabled: boolean,
) {
  const { session } = useAuth();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { useDetail } = useExpenses();
  const detail = useDetail(expenseId ?? "", {
    enabled: enabled && Boolean(expenseId),
  });
  const activity = useInfiniteQuery({
    queryKey: ["expense-activity", expenseId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchExpenseActivity(expenseId!, pageParam, token),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled: enabled && Boolean(expenseId),
    staleTime: 0,
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
      queryClient.invalidateQueries({
        queryKey: ["expense-activity", expenseId],
      }),
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),
    ]);
  }

  const transition = useMutation({
    mutationFn: ({
      status,
      reason,
    }: {
      status: ExpenseLifecycleStatus;
      reason?: string;
    }) => transitionExpense(expenseId!, status, reason, token),
    onSuccess: refresh,
  });
  const retireEvidence = useMutation({
    mutationFn: ({ mediaId, reason }: { mediaId: string; reason: string }) =>
      retireExpenseReceipt(expenseId!, mediaId, reason, token),
    onSuccess: refresh,
  });
  const uploadEvidence = useMutation({
    mutationFn: (receipts: Parameters<typeof uploadExpenseReceipts>[1]) =>
      uploadExpenseReceipts(expenseId!, receipts, token),
    onSuccess: refresh,
  });

  return { activity, detail, retireEvidence, transition, uploadEvidence };
}
