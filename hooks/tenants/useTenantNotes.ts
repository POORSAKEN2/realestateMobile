import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import {
  apiTenantNoteRepository,
  type TenantNoteRepository,
} from "../../services/tenantNoteRepository";
import type {
  CreateTenantNotePayload,
  TenantNotePage,
  UpdateTenantNotePayload,
} from "../../types";
import { useAuth } from "../useAuth";

export const tenantNoteKeys = {
  all: ["tenant-notes"] as const,
  client: (accessToken?: string, clientId?: string) =>
    [...tenantNoteKeys.all, accessToken, clientId] as const,
};

export function useTenantNotes({
  enabled = true,
  repository = apiTenantNoteRepository,
  tenantId,
}: {
  enabled?: boolean;
  repository?: TenantNoteRepository;
  tenantId?: string;
}) {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const queryKey = tenantNoteKeys.client(accessToken, tenantId);
  const notesQuery = useInfiniteQuery<
    TenantNotePage,
    Error,
    InfiniteData<TenantNotePage>,
    ReturnType<typeof tenantNoteKeys.client>,
    number
  >({
    enabled: Boolean(enabled && accessToken && tenantId),
    gcTime: 0,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.lastPage
        ? lastPage.currentPage + 1
        : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      if (!tenantId) throw new Error("Select a tenant to load notes.");

      return repository.list(
        { clientId: tenantId, page: pageParam, perPage: 15 },
        accessToken,
        signal,
      );
    },
    queryKey,
  });
  const invalidateNotes = () =>
    queryClient.invalidateQueries({ queryKey: tenantNoteKeys.all });
  const createMutation = useMutation({
    mutationFn: (payload: CreateTenantNotePayload) =>
      repository.create(payload, accessToken),
    onSuccess: invalidateNotes,
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTenantNotePayload;
    }) => repository.update(id, payload, accessToken),
    onSuccess: invalidateNotes,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => repository.delete(id, accessToken),
    onSuccess: invalidateNotes,
  });
  const notes = useMemo(
    () => notesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [notesQuery.data],
  );

  return {
    createNote: createMutation.mutateAsync,
    deleteNote: deleteMutation.mutateAsync,
    error: notesQuery.error,
    fetchNextPage: notesQuery.fetchNextPage,
    hasNextPage: notesQuery.hasNextPage,
    isDeleting: deleteMutation.isPending,
    isFetchingNextPage: notesQuery.isFetchingNextPage,
    isLoading: notesQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    notes,
    updateNote: updateMutation.mutateAsync,
  };
}
