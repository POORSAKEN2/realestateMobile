import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope } from "../types";
import type {
  BillingEntitlement,
  CheckoutSessionPayload,
  CheckoutSessionResponse,
} from "../types/domain/billing";

export async function fetchBillingEntitlement(
  accessToken?: string,
): Promise<BillingEntitlement> {
  const response = await apiClient.get<
    ApiEnvelope<BillingEntitlement> | BillingEntitlement
  >("/billing/entitlement", {
    headers: authHeaders(accessToken),
  });

  return unwrapData<BillingEntitlement>(response);
}

export async function createBillingCheckout(
  payload: CheckoutSessionPayload,
  accessToken?: string,
): Promise<CheckoutSessionResponse> {
  const response = await apiClient.post<
    ApiEnvelope<CheckoutSessionResponse> | CheckoutSessionResponse
  >(
    "/billing/checkout",
    {
      ...payload,
      success_url: payload.success_url || "https://terrane.app/billing/success",
      cancel_url: payload.cancel_url || "https://terrane.app/billing/cancel",
    },
    {
      headers: authHeaders(accessToken),
    },
  );

  return unwrapData<CheckoutSessionResponse>(response);
}
