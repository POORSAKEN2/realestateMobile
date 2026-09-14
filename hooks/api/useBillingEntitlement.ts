import { useQuery } from "@tanstack/react-query";
import { fetchBillingEntitlement } from "../../api/billing";

export const BILLING_ENTITLEMENT_QUERY_KEY = ["billingEntitlement"] as const;

export function useBillingEntitlement(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: BILLING_ENTITLEMENT_QUERY_KEY,
    queryFn: () => fetchBillingEntitlement(),
    enabled: options?.enabled,
  });
}
