import { useQuery } from "@tanstack/react-query";

import {
  fetchPortfolioHistory,
  fetchPortfolioStats,
} from "../../api/analytics";

export const portfolioAnalyticsKeys = {
  all: ["analytics"] as const,
  stats: (accessToken?: string) =>
    [...portfolioAnalyticsKeys.all, "stats", accessToken] as const,
  history: (accessToken?: string) =>
    [...portfolioAnalyticsKeys.all, "history", accessToken] as const,
};

export function usePortfolioAnalytics(accessToken?: string) {
  const statsQuery = useQuery({
    queryKey: portfolioAnalyticsKeys.stats(accessToken),
    queryFn: () => fetchPortfolioStats(accessToken),
  });
  const historyQuery = useQuery({
    queryKey: portfolioAnalyticsKeys.history(accessToken),
    queryFn: () => fetchPortfolioHistory(accessToken),
  });

  return {
    stats: statsQuery.data,
    history: historyQuery.data ?? [],
    isLoading: statsQuery.isLoading || historyQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isError: statsQuery.isError || historyQuery.isError,
    refetch: async () => {
      await Promise.all([statsQuery.refetch(), historyQuery.refetch()]);
    },
  };
}
