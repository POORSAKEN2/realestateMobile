import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useProperties } from "../api/useProperties";
import { clientKeys } from "../api/useClients";
import { useAuth } from "../useAuth";
import {
  BILLING_ENTITLEMENT_QUERY_KEY,
  useBillingEntitlement,
} from "../api/useBillingEntitlement";
import {
  apiDocumentRepository,
  type DocumentRepository,
} from "../../services/documentRepository";
import type { DocumentUpload, PropertyDocument } from "../../types";
import type { DocumentFormValues } from "../../utils/documents/documentForm";
import {
  formatBytes,
  remainingStorageBytes,
  storageUploadError,
} from "../../utils/billing/entitlementCapabilities";

type SaveDocumentInput = {
  editingDocument: PropertyDocument | null;
  file: DocumentUpload | null;
  values: DocumentFormValues;
};

export function useDocumentLibrary(
  repository: DocumentRepository = apiDocumentRepository,
) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const entitlementQuery = useBillingEntitlement();
  const { useList } = useProperties();
  const propertiesQuery = useList();
  const documentsQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => repository.list(accessToken),
    queryKey: ["documents", accessToken],
  });
  const clientsQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => repository.listClients(accessToken),
    queryKey: clientKeys.list(accessToken),
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      editingDocument,
      file,
      values,
    }: SaveDocumentInput) => {
      if (!accessToken)
        throw new Error("Please log in before saving documents.");
      const quotaError = !editingDocument && file
        ? storageUploadError(entitlementQuery.data, [file])
        : null;
      if (quotaError) throw new Error(quotaError);

      const name = values.name.trim();
      if (editingDocument) {
        return repository.update(
          editingDocument.id,
          {
            category: values.category,
            file: file ?? undefined,
            lesseeId: values.lesseeId || null,
            name,
            propertyId: values.propertyId || null,
            revisionComment: values.revisionComment.trim() || undefined,
          },
          accessToken,
        );
      }

      if (!file) throw new Error("Choose a file to upload.");
      return repository.create(
        {
          category: values.category,
          file,
          lesseeId: values.lesseeId || undefined,
          name,
          propertyId: values.propertyId || undefined,
        },
        accessToken,
      );
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY }),
      ]),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      repository.remove(documentId, accessToken),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENT_QUERY_KEY }),
      ]),
  });

  const isLoading =
    documentsQuery.isLoading ||
    clientsQuery.isLoading ||
    propertiesQuery.isLoading;

  async function refresh() {
    await Promise.all([
      documentsQuery.refetch(),
      clientsQuery.refetch(),
      propertiesQuery.refetch(),
    ]);
  }

  return {
    deleteDocument: deleteMutation.mutateAsync,
    documents: documentsQuery.data ?? [],
    error: documentsQuery.error,
    isDeleting: deleteMutation.isPending,
    isError: documentsQuery.isError,
    isLoading,
    isSaving: saveMutation.isPending,
    lessees: clientsQuery.data ?? [],
    properties: propertiesQuery.data ?? [],
    refresh,
    saveDocument: saveMutation.mutateAsync,
    storageRemainingLabel: (() => {
      const remaining = remainingStorageBytes(entitlementQuery.data);
      return remaining === null ? undefined : `${formatBytes(remaining)} plan storage remaining`;
    })(),
  };
}
