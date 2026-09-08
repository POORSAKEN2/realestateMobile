import { useQuery } from "@tanstack/react-query";

import { fetchPropertyOwners } from "../../api/propertyOwners";

export function usePropertyOwners(accessToken?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(accessToken && enabled),
    queryFn: () => fetchPropertyOwners(accessToken),
    queryKey: ["propertyOwners", accessToken],
  });
}
