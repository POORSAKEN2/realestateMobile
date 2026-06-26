import {
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { PaginatedApiData } from "../../types/api/common";

export interface PaginatedResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => void;
}

export function usePaginatedQuery<TData, TError extends Error = Error>(
  queryKey: QueryKey,
  queryFn: (params: { pageParam: number }) => Promise<PaginatedApiData<TData>>,
  options?: Omit<
    UseInfiniteQueryOptions<
      PaginatedApiData<TData>,
      TError,
      import("@tanstack/react-query").InfiniteData<PaginatedApiData<TData>>,
      QueryKey,
      number
    >,
    "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
  >
): PaginatedResult<TData> {
  const queryInfo = useInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (
        lastPage.current_page !== undefined &&
        lastPage.last_page !== undefined &&
        lastPage.current_page < lastPage.last_page
      ) {
        return lastPage.current_page + 1;
      }
      return undefined;
    },
    ...options,
  });

  const flattenedData =
    queryInfo.data?.pages.flatMap((page) => page.data ?? []) ?? [];

  return {
    data: flattenedData,
    isLoading: queryInfo.isLoading,
    isError: queryInfo.isError,
    error: queryInfo.error,
    fetchNextPage: () => {
      if (queryInfo.hasNextPage && !queryInfo.isFetchingNextPage) {
        queryInfo.fetchNextPage();
      }
    },
    hasNextPage: queryInfo.hasNextPage,
    isFetchingNextPage: queryInfo.isFetchingNextPage,
    refetch: queryInfo.refetch,
  };
}
