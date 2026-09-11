import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope } from "../types";
import type {
  BillingEntitlement,
  PlanChangePreview,
  SubscriptionTierKey,
} from "../types/domain/billing";

export async function fetchPlanChangePreview(
  tier: SubscriptionTierKey,
  accessToken?: string,
): Promise<PlanChangePreview> {
  return unwrapData(
    await apiClient.get<ApiEnvelope<PlanChangePreview>>(
      `/billing/plan-change-preview?tier=${encodeURIComponent(tier)}`,
      { headers: authHeaders(accessToken) },
    ),
  );
}

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
