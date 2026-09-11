import type { BillingEntitlement } from "../../types/domain/billing";
import { hasPlanCapability } from "../billing/planCapabilities";

export function hasInquiryWorkflowAccess(
  entitlement?: BillingEntitlement | null,
) {
  return hasPlanCapability(entitlement, "inquiry_actions");
}
