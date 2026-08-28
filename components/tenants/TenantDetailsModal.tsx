import { useRouter } from "expo-router";
import { useEffect, useReducer, useRef, useState } from "react";
import { Alert } from "react-native";

import { appRoutes } from "../../constants/navigation";
import { useTenantDetailsData } from "../../hooks/tenants/useTenantDetailsData";
import { useTenantDocumentSelector } from "../../hooks/tenants/useTenantDocumentSelector";
import { useTenantNoteEditor } from "../../hooks/tenants/useTenantNoteEditor";
import { useTenantNotes } from "../../hooks/tenants/useTenantNotes";
import { useMountedRef } from "../../hooks/useMountedRef";
import type { Lease, Lessee, PropertyDocument, TenantNote } from "../../types";
import { openPropertyDocument } from "../../utils/dashboard/dashboardHelpers";
import { tenantDetailsViewReducer } from "../../utils/tenants/tenantDetailsView";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { TenantDetailsContent } from "./TenantDetailsContent";
import { TenantDocumentSelector } from "./TenantDocumentSelector";
import { TenantNoteEditor } from "./TenantNoteEditor";

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
  const isMounted = useMountedRef();
  const [activeView, dispatchView] = useReducer(
    tenantDetailsViewReducer,
    "details",
  );
  const isDocumentSelectorVisible = activeView === "document-selector";
  const isNoteEditorVisible = activeView === "note-editor";
  const [deleteNoteTarget, setDeleteNoteTarget] = useState<TenantNote | null>(
    null,
  );
  const pendingDocumentNavigation = useRef<PendingDocumentNavigation | null>(
    null,
  );
  const tenantDetails = useTenantDetailsData(tenant, leases);
  const tenantNotes = useTenantNotes({ tenantId: tenant?.id });
  const noteEditor = useTenantNoteEditor({
    onSave: ({ note, payload }) => {
      if (note) {
        return tenantNotes.updateNote({ id: note.id, payload });
      }
      if (!tenant) throw new Error("Select a tenant before adding a note.");

      return tenantNotes.createNote({ ...payload, clientId: tenant.id });
    },
    onSaved: () => dispatchView({ type: "show-details" }),
    tenantId: tenant?.id,
  });
  const documentSelector = useTenantDocumentSelector({
    enabled: isDocumentSelectorVisible,
    tenantId: tenant?.id,
  });

  useEffect(() => {
    dispatchView({ type: "show-details" });
    setDeleteNoteTarget(null);
  }, [tenant?.id]);

  function openNoteEditor(note?: TenantNote) {
    noteEditor.open(note);
    dispatchView({ type: "open-note-editor" });
  }

  async function deleteNote() {
    if (!deleteNoteTarget) return;

    try {
      await tenantNotes.deleteNote(deleteNoteTarget.id);
      if (isMounted.current) setDeleteNoteTarget(null);
    } catch {
      if (isMounted.current) {
        Alert.alert(
          "Cannot delete note",
          "The internal note could not be deleted.",
        );
      }
    }
  }

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
    <>
      <BottomSheetModal
        backdropAccessibilityLabel={
          isDocumentSelectorVisible
            ? "Close document selector"
            : isNoteEditorVisible
              ? "Close note editor"
              : "Close tenant details"
        }
        keyboardAvoiding={isNoteEditorVisible}
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
          ) : isNoteEditorVisible ? (
            <TenantNoteEditor
              error={noteEditor.formError}
              form={noteEditor.form}
              isSaving={tenantNotes.isSaving}
              note={noteEditor.editingNote}
              onBack={() => dispatchView({ type: "show-details" })}
              onSubmit={() => void noteEditor.submit()}
              onUpdate={noteEditor.updateForm}
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
              onAddNote={() => openNoteEditor()}
              onClose={onClose}
              onDeleteNote={setDeleteNoteTarget}
              onEditNote={openNoteEditor}
              onLoadMoreNotes={() => void tenantNotes.fetchNextPage()}
              onOpenDocument={(document) => void openPropertyDocument(document)}
              onSelectDocument={() =>
                dispatchView({ type: "open-document-selector" })
              }
              onViewAllDocuments={() => openDocumentLibrary()}
              propertyNames={propertyNames}
              tenant={tenant}
              tenantNotes={tenantNotes.notes}
              tenantNotesError={tenantNotes.error}
              tenantNotesHasNextPage={Boolean(tenantNotes.hasNextPage)}
              tenantNotesIsFetchingNextPage={tenantNotes.isFetchingNextPage}
              tenantNotesIsLoading={tenantNotes.isLoading}
            />
          )
        ) : null}
      </BottomSheetModal>

      <ConfirmationModal
        description="This removes the internal note permanently."
        isPending={tenantNotes.isDeleting}
        onCancel={() => setDeleteNoteTarget(null)}
        onConfirm={() => void deleteNote()}
        title="Delete internal note?"
        visible={Boolean(deleteNoteTarget)}
      />
    </>
  );
}
