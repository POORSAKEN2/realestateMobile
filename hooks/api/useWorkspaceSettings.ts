import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchEffectiveWorkspaceSettings,
  fetchWorkspaceSettings,
  updateWorkspaceSettings,
} from "../../api/workspaceSettings";
import type { UpdateWorkspaceSettings } from "../../types/domain/workspaceSettings";
import { useAccess } from "../auth/useAccess";
import { useAuth } from "../useAuth";

function useWorkspaceIdentity() {
  const { session } = useAuth();
  const user = session?.user as
    | { id?: string | number; tenant_id?: string | number }
    | undefined;
  return [String(user?.tenant_id ?? ""), String(user?.id ?? "")] as const;
}

export function workspaceSettingsQueryKey(identity: readonly string[]) {
  return ["workspace-settings", ...identity] as const;
}

export function effectiveWorkspaceSettingsQueryKey(identity: readonly string[]) {
  return ["workspace-settings-effective", ...identity] as const;
}

export function useEffectiveWorkspaceSettings() {
  const { isAuthenticated } = useAuth();
  const identity = useWorkspaceIdentity();
  return useQuery({
    queryKey: effectiveWorkspaceSettingsQueryKey(identity),
    queryFn: ({ signal }) => fetchEffectiveWorkspaceSettings(signal),
    enabled: isAuthenticated,
  });
}

export function useWorkspaceSettings() {
  const identity = useWorkspaceIdentity();
  const { can } = useAccess();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: workspaceSettingsQueryKey(identity),
    queryFn: ({ signal }) => fetchWorkspaceSettings(signal),
    enabled: can("settings.view"),
    staleTime: 0,
  });
  const mutation = useMutation({
    mutationFn: (changes: UpdateWorkspaceSettings) =>
      updateWorkspaceSettings(changes),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceSettingsQueryKey(identity),
        }),
        queryClient.invalidateQueries({
          queryKey: effectiveWorkspaceSettingsQueryKey(identity),
        }),
        queryClient.invalidateQueries({ queryKey: ["audit-history"] }),
      ]);
    },
  });
  return { query, mutation };
}
