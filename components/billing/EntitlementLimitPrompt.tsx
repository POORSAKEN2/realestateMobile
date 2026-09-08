import { useEffect, useState } from "react";
import { Alert, AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { entitlementLimitDetails, type ApiError } from "../../api/errors";
import { subscribeEntitlementLimit } from "../../services/billing/entitlementEvents";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { BILLING_ENTITLEMENT_QUERY_KEY } from "../../hooks/api/useBillingEntitlement";
import { UpgradePlanModal } from "./UpgradePlanModal";

export function EntitlementLimitPrompt({ active = true, priority = 0 }: { active?: boolean; priority?: number }) {
  const [failure, setFailure] = useState<ApiError | null>(null);
  const { can } = useAccess();
  const { session } = useAuth();
  const client = useQueryClient();
  useEffect(() => { setFailure(null); }, [session?.accessToken, active]);
  useEffect(() => active ? subscribeEntitlementLimit(error => {
    void client.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY });
    if (!can("billing.checkout")) {
      Alert.alert("Plan limit reached", `${error.message}\n\nAsk your account owner to review the organization plan.`);
    } else {
      setFailure(error);
    }
  }, priority) : undefined, [active, can, client, priority]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active" && priority === 0) void client.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY });
    });
    return () => subscription.remove();
  }, [client, priority]);
  return failure && can("billing.checkout") ? <UpgradePlanModal isVisible onClose={() => setFailure(null)}
    message={failure.message} requiredTier={entitlementLimitDetails(failure)?.required_plan?.key} /> : null;
}
