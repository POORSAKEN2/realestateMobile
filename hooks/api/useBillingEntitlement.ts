import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBillingCheckout,
  fetchBillingEntitlement,
} from "../../api/billing";
import type { CheckoutSessionPayload } from "../../types/domain/billing";

export const BILLING_ENTITLEMENT_QUERY_KEY = ["billingEntitlement"] as const;

export function useBillingEntitlement() {
  return useQuery({
    queryKey: BILLING_ENTITLEMENT_QUERY_KEY,
    queryFn: () => fetchBillingEntitlement(),
  });
}

export function useCreateBillingCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckoutSessionPayload) => createBillingCheckout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY });
    },
  });
}
