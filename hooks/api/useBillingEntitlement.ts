import { useQuery } from "@tanstack/react-query";
import { fetchBillingEntitlement } from "../../api/billing";
import { useAuth } from "../useAuth";
import { hasAppPermission } from "../../utils/auth/accessPolicy";
import { getRevenueCatIdentity } from "../../utils/billing/revenueCatCustomer";

export const BILLING_ENTITLEMENT_QUERY_KEY = ["billingEntitlement"] as const;

export function billingEntitlementQueryKey(tenantId: string | null) {
  return [...BILLING_ENTITLEMENT_QUERY_KEY, tenantId] as const;
}

export function useBillingEntitlement(options?: { enabled?: boolean }) {
  const { session, isLoading } = useAuth();
  const identity = getRevenueCatIdentity(session?.user);
  return useQuery({
    queryKey: billingEntitlementQueryKey(identity?.appUserId ?? null),
    queryFn: ({ signal }) =>
      fetchBillingEntitlement(session?.accessToken, signal),
    enabled:
      !isLoading &&
      Boolean(session?.accessToken) &&
      Boolean(identity) &&
      hasAppPermission(session?.user, "billing.viewEntitlement") &&
      options?.enabled !== false,
  });
}
