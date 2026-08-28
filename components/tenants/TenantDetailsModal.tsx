import { useRouter } from "expo-router";
import { useEffect, useReducer, useRef } from "react";
import { Alert } from "react-native";

import { appRoutes } from "../../constants/navigation";
import { useTenantDetailsData } from "../../hooks/tenants/useTenantDetailsData";
import { useTenantDocumentSelector } from "../../hooks/tenants/useTenantDocumentSelector";
import type { Lease, Lessee, PropertyDocument } from "../../types";
import { openPropertyDocument } from "../../utils/dashboard/dashboardHelpers";
import { tenantDetailsViewReducer } from "../../utils/tenants/tenantDetailsView";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { TenantDetailsContent } from "./TenantDetailsContent";
import { TenantDocumentSelector } from "./TenantDocumentSelector";

type PendingDocumentNavigation = {
  action?: "add";
  tenantId: string;
  tenantName: string;
};

export function TenantDetailsModal({
  leases = [],
  linkedLeaseCount,
  monthlyRent,
  onClose,
  propertyNames = [],
  tenant,
}: {
  leases?: Lease[];
  linkedLeaseCount?: number;
  monthlyRent?: number;
  onClose: () => void;
  propertyNames?: string[];
  tenant: Lessee | null;
}) {
  const router = useRouter();
  const [activeView, dispatchView] = useReducer(
    tenantDetailsViewReducer,
    "details",
  );
  const isDocumentSelectorVisible = activeView === "document-selector";
  const pendingDocumentNavigation = useRef<PendingDocumentNavigation | null>(
    null,
  );
  const tenantDetails = useTenantDetailsData(tenant, leases);
  const documentSelector = useTenantDocumentSelector({
    enabled: isDocumentSelectorVisible,
    tenantId: tenant?.id,
  });

  useEffect(() => {
    dispatchView({ type: "show-details" });
  }, [tenant?.id]);

  function openDocumentLibrary(action?: "add") {
    if (!tenant) return;
    pendingDocumentNavigation.current = {
      action,
      tenantId: tenant.id,
      tenantName: tenant.name,
    };
    onClose();
  }

  function handleDismiss() {
    const pendingNavigation = pendingDocumentNavigation.current;
    if (!pendingNavigation) return;

    pendingDocumentNavigation.current = null;
    router.push({
      pathname: appRoutes.secondary.documents,
      params: {
        ...(pendingNavigation.action
          ? { action: pendingNavigation.action }
          : {}),
        tenantId: pendingNavigation.tenantId,
        tenantName: pendingNavigation.tenantName,
      },
    });
  }

  async function linkDocument(document: PropertyDocument) {
    try {
      await documentSelector.linkDocument(document.id);
      dispatchView({ type: "show-details" });
    } catch {
      Alert.alert(
        "Cannot link document",
        "The document could not be linked to this tenant.",
      );
    }
  }

  return (
    <BottomSheetModal
      backdropAccessibilityLabel={
        isDocumentSelectorVisible
          ? "Close document selector"
          : "Close tenant details"
      }
      onClose={onClose}
      onDismiss={handleDismiss}
      statusBarTranslucent
      visible={Boolean(tenant)}
    >
      {tenant ? (
        isDocumentSelectorVisible ? (
          <TenantDocumentSelector
            documents={documentSelector.documents}
            error={documentSelector.error}
            isLinking={documentSelector.isLinking}
            isLoading={documentSelector.isLoading}
            linkingDocumentId={documentSelector.linkingDocumentId}
            onBack={() => dispatchView({ type: "show-details" })}
            onChangeQuery={documentSelector.setQuery}
            onLink={(document) => void linkDocument(document)}
            query={documentSelector.query}
          />
        ) : (
          <TenantDetailsContent
            documents={tenantDetails.documents}
            documentsError={tenantDetails.documentsError}
            isLoadingDocuments={tenantDetails.isLoadingDocuments}
            isLoadingLedger={tenantDetails.isLoadingLedger}
            ledger={tenantDetails.ledger}
            ledgerError={tenantDetails.ledgerError}
            linkedLeaseCount={linkedLeaseCount}
            monthlyRent={monthlyRent}
            onAddDocument={() => openDocumentLibrary("add")}
            onClose={onClose}
            onOpenDocument={(document) => void openPropertyDocument(document)}
            onSelectDocument={() =>
              dispatchView({ type: "open-document-selector" })
            }
            onViewAllDocuments={() => openDocumentLibrary()}
            propertyNames={propertyNames}
            tenant={tenant}
          />
        )
      ) : null}
    </BottomSheetModal>
  );
}
