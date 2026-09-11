import { useState } from "react";

import type { Inquiry, InquiryStatus } from "../../types/domain/inquiries";
import { hasInquiryWorkflowAccess } from "../../utils/inquiries/inquiryAccess";
import { useAccess } from "../auth/useAccess";
import { useBillingEntitlement } from "../api/useBillingEntitlement";
import { useUpdateInquiryStatus } from "../api/useInquiries";
import { useSnackbar } from "../useSnackbar";

export function useInquiryStatusController() {
  const { can } = useAccess();
  const entitlementQuery = useBillingEntitlement();
  const mutation = useUpdateInquiryStatus();
  const snackbar = useSnackbar();
  const [isUpgradeVisible, setUpgradeVisible] = useState(false);

  function hasWritePermission(inquiry: Inquiry) {
    return can("leads.update", inquiry.property.id || undefined);
  }

  function canUpdate(inquiry: Inquiry) {
    return (
      hasWritePermission(inquiry) &&
      hasInquiryWorkflowAccess(entitlementQuery.data)
    );
  }

  async function requestStatusChange(inquiry: Inquiry, status: InquiryStatus) {
    if (status === inquiry.status || mutation.isPending) return;

    if (!hasWritePermission(inquiry)) {
      snackbar.show("Your account cannot update this inquiry.");
      return;
    }

    let entitlement = entitlementQuery.data;
    if (!entitlement) {
      const refreshed = await entitlementQuery.refetch();
      entitlement = refreshed.data;
      if (!entitlement) {
        snackbar.show("Plan access could not be verified. Try again.");
        return;
      }
    }

    if (!hasInquiryWorkflowAccess(entitlement)) {
      if (can("billing.checkout")) {
        setUpgradeVisible(true);
      } else {
        snackbar.show("Tier 1 is required. Ask your account owner to upgrade.");
      }
      return;
    }

    try {
      await mutation.mutateAsync({ id: inquiry.id, status });
      snackbar.show(`Inquiry marked ${status}.`);
    } catch (error) {
      snackbar.show(
        error instanceof Error ? error.message : "Inquiry update failed.",
      );
    }
  }

  return {
    canUpdate,
    closeUpgrade: () => setUpgradeVisible(false),
    isUpdating: (inquiryId: string) =>
      mutation.isPending && mutation.variables?.id === inquiryId,
    isUpgradeVisible,
    requestStatusChange,
    snackbar,
  };
}
