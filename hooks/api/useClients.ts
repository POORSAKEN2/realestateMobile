import { useQuery } from "@tanstack/react-query";

import { fetchClients } from "../../api/clients";

export const clientKeys = {
  all: ["clients"] as const,
  list: (accessToken?: string) => [...clientKeys.all, accessToken] as const,
};

export function useClients(accessToken?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(accessToken) && enabled,
    queryKey: clientKeys.list(accessToken),
    queryFn: () => fetchClients(accessToken),
  });
}
