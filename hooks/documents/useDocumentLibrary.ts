import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useProperties } from "../api/useProperties";
import { useAuth } from "../useAuth";
import {
  apiDocumentRepository,
  type DocumentRepository,
} from "../../services/documentRepository";
import type { DocumentUpload, PropertyDocument } from "../../types";
import type { DocumentFormValues } from "../../utils/documents/documentForm";

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
  const { useList } = useProperties();
  const propertiesQuery = useList();
  const documentsQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => repository.list(accessToken),
    queryKey: ["documents", accessToken],
  });
  const lesseesQuery = useQuery({
    enabled: Boolean(accessToken),
    queryFn: () => repository.listLessees(accessToken),
    queryKey: ["lessees", accessToken],
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      editingDocument,
      file,
      values,
    }: SaveDocumentInput) => {
      if (!accessToken)
        throw new Error("Please log in before saving documents.");

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      repository.remove(documentId, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  return {
    deleteDocument: deleteMutation.mutateAsync,
    documents: documentsQuery.data ?? [],
    error: documentsQuery.error,
    isDeleting: deleteMutation.isPending,
    isError: documentsQuery.isError,
    isLoading: documentsQuery.isLoading,
    isRefreshing: documentsQuery.isRefetching,
    isSaving: saveMutation.isPending,
    lessees: lesseesQuery.data ?? [],
    properties: propertiesQuery.data ?? [],
    refresh: documentsQuery.refetch,
    saveDocument: saveMutation.mutateAsync,
  };
}
