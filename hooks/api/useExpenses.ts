import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

import { usePaginatedQuery } from "./usePaginatedResource";
import {
  CreateExpensePayload,
  UpdateExpensePayload,
  Expense,
} from "../../types/domain/expenses";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
} from "../../api/expenses";

// Query keys for caching and automatic cache invalidation
export const expenseKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseKeys.all, "list"] as const,
  list: (filters?: any) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, "detail"] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

// Data fetchers to handle requests
export const expenseFetchers = {
  getList: async (filters?: any) => {
    // Note: If fetchExpenses does not support backend pagination,
    // we wrap it in a paginated format just like properties
    const results = await fetchExpenses();
    return {
      data: results,
      current_page: 1,
      last_page: 1,
    };
  },
  getDetail: async (id: string) => {
    // Placeholder fallback
    throw new Error("getDetail not implemented in api/expenses.ts");
  },
  create: async (payload: CreateExpensePayload) => {
    return await createExpense(payload);
  },
  update: async ({
    id,
    payload,
  }: {
    id: string;
    payload: UpdateExpensePayload;
  }) => {
    return await updateExpense(id, payload);
  },
};

export function useExpenses() {
  const queryClient = useQueryClient();

  return {
    useList: (filters?: any) => {
      return usePaginatedQuery(expenseKeys.list(filters), () =>
        expenseFetchers.getList(filters),
      );
    },
    useDetail: (id: string, options?: UseQueryOptions<Expense, Error>) => {
      return useQuery({
        queryKey: expenseKeys.detail(id),
        queryFn: () => expenseFetchers.getDetail(id),
        ...options,
      });
    },
    useCreate: () => {
      return useMutation({
        mutationFn: expenseFetchers.create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
        },
      });
    },
    useUpdate: () => {
      return useMutation({
        mutationFn: expenseFetchers.update,
        onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
          queryClient.invalidateQueries({
            queryKey: expenseKeys.detail(variables.id),
          });
        },
      });
    },
  };
}
