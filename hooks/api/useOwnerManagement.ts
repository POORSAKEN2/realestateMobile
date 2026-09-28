import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOwner,
  fetchOwnerPage,
  fetchOwnerProperties,
  saveOwner,
  type OwnerDraft,
} from "../../api/propertyOwners";
import { useAuth } from "../useAuth";
import { useAccess } from "../auth/useAccess";
import { getSessionAccess } from "../../services/access/sessionAccess";
import type { PropertyOwner } from "../../types";

export function useOwnerDetail(id?: string) {
  const { session } = useAuth();
  const { access } = useAccess();
  return useQuery({
    queryKey: ["ownerManagement", session?.accessToken, "detail", id],
    queryFn: ({ signal }) => fetchOwner(id!, signal),
    enabled: access.role === "ADMIN" && Boolean(id),
  });
}

export function useOwnerList(page: number, search: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["ownerManagement", session?.accessToken, "list", page, search],
    queryFn: ({ signal }) => fetchOwnerPage(page, search, signal),
  });
}

export function useOwnerProperties(id: string | undefined, page: number) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["ownerManagement", session?.accessToken, "properties", id, page],
    queryFn: ({ signal }) => fetchOwnerProperties(id!, page, signal),
    enabled: Boolean(id),
  });
}

export function useSaveOwner() {
  const cache = useQueryClient();
  const { session } = useAuth();
  const token = session?.accessToken;
  return useMutation({
    mutationFn: ({ draft, id }: { draft: OwnerDraft; id?: string }) =>
      saveOwner(draft, id),
    onSuccess: async (owner) => {
      if (getSessionAccess().token !== token) return;
      cache.setQueryData<PropertyOwner[]>(
        ["propertyOwners", token],
        (current) => [
          ...(current ?? []).filter((item) => item.id !== owner.id),
          owner,
        ],
      );
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["ownerManagement", token] }),
        cache.invalidateQueries({ queryKey: ["propertyOwners", token] }),
      ]);
    },
  });
}
