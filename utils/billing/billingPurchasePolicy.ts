import { hasAppPermission } from "../auth/accessPolicy";
import { getRevenueCatProductKey } from "./revenueCatCustomer";

/** Evaluate current session immediately before invoking a store operation. */
export function authorizeBillingPurchase(user: unknown, productIdentifier?: string) {
  if (!hasAppPermission(user, "billing.checkout")) {
    throw new Error("Only account administrators can manage purchases.");
  }
  if (productIdentifier !== undefined) {
    const key = getRevenueCatProductKey(productIdentifier);
    if (!key || !["starter_", "professional_", "portfolio_"].some(prefix => key.startsWith(prefix))) {
      throw new Error("This plan is no longer available for purchase.");
    }
  }
}
