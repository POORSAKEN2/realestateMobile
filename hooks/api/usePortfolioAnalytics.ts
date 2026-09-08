import { useQuery } from "@tanstack/react-query";

import {
  fetchPortfolioHistory,
  fetchPortfolioStats,
} from "../../api/analytics";

export const portfolioAnalyticsKeys = {
  all: ["analytics"] as const,
  stats: (accessToken?: string) =>
    [...portfolioAnalyticsKeys.all, "stats", accessToken] as const,
  history: (accessToken?: string, retentionDays?: number | null) =>
    [...portfolioAnalyticsKeys.all, "history", accessToken, retentionDays] as const,
};

export function usePortfolioAnalytics(
  accessToken?: string,
  {
    historyEnabled = true,
    retentionDays,
  }: { historyEnabled?: boolean; retentionDays?: number | null } = {},
) {
  const statsQuery = useQuery({
    queryKey: portfolioAnalyticsKeys.stats(accessToken),
    queryFn: () => fetchPortfolioStats(accessToken),
  });
  const historyQuery = useQuery({
    enabled: Boolean(accessToken && historyEnabled),
    queryKey: portfolioAnalyticsKeys.history(accessToken, retentionDays),
    queryFn: () => fetchPortfolioHistory(accessToken, retentionDays),
  });

  return {
    stats: statsQuery.data,
    history: historyQuery.data ?? [],
    isLoading: statsQuery.isLoading || (historyEnabled && historyQuery.isLoading),
    isLoadingStats: statsQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isError: statsQuery.isError || (historyEnabled && historyQuery.isError),
    refetch: async () => {
      await Promise.all([
        statsQuery.refetch(),
        ...(historyEnabled ? [historyQuery.refetch()] : []),
      ]);
    },
  };
}
