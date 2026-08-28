import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  apiDocumentRepository,
  type DocumentRepository,
} from "../../services/documentRepository";
import type { PropertyDocument } from "../../types";
import { getSelectableTenantDocuments } from "../../utils/tenants/tenantDocumentSelection";
import { useAuth } from "../useAuth";

export function useTenantDocumentSelector({
  enabled,
  repository = apiDocumentRepository,
  tenantId,
}: {
  enabled: boolean;
  repository?: Pick<DocumentRepository, "list" | "update">;
  tenantId?: string;
}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const documentsQuery = useQuery({
    enabled: Boolean(enabled && accessToken && tenantId),
    queryFn: ({ signal }) => repository.list(accessToken, signal),
    queryKey: ["documents", accessToken],
  });
  const linkMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!accessToken || !tenantId) {
        throw new Error("Tenant document linking is unavailable.");
      }

      return repository.update(documentId, { lesseeId: tenantId }, accessToken);
    },
    onSuccess: (linkedDocument) => {
      queryClient.setQueryData<PropertyDocument[]>(
        ["documents", accessToken],
        (current) =>
          current?.map((document) =>
            document.id === linkedDocument.id ? linkedDocument : document,
          ),
      );
      queryClient.setQueryData<PropertyDocument[]>(
        ["documents", accessToken, "tenant", tenantId],
        (current = []) => {
          if (current.some(({ id }) => id === linkedDocument.id))
            return current;
          return [linkedDocument, ...current];
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ["documents", accessToken],
      });
    },
  });
  const documents = useMemo(
    () => getSelectableTenantDocuments(documentsQuery.data ?? [], query),
    [documentsQuery.data, query],
  );

  useEffect(() => {
    if (!enabled) setQuery("");
  }, [enabled]);

  return {
    documents,
    error: documentsQuery.error,
    isLinking: linkMutation.isPending,
    isLoading: documentsQuery.isLoading,
    linkingDocumentId: linkMutation.variables,
    linkDocument: linkMutation.mutateAsync,
    query,
    setQuery,
  };
}
