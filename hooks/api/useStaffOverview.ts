import { useQuery } from "@tanstack/react-query";

import { fetchStaffOverview } from "../../api/staff";

export const staffOverviewKeys = {
  all: ["staff-overview"] as const,
  overview: (accessToken?: string) =>
    [...staffOverviewKeys.all, accessToken] as const,
};

export function useStaffOverview(accessToken?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(accessToken) && enabled,
    queryKey: staffOverviewKeys.overview(accessToken),
    queryFn: () => fetchStaffOverview(accessToken),
  });
}
