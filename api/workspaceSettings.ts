import type {
  UpdateWorkspaceSettings,
  EffectiveWorkspaceSettings,
  WorkspaceSettingsResponse,
} from "../types/domain/workspaceSettings";
import { apiClient, unwrapData } from "./client";

export async function fetchWorkspaceSettings(signal?: AbortSignal) {
  const response = await apiClient.get<WorkspaceSettingsResponse>("/settings", {
    signal,
    access: { permission: "settings.view" },
  });
  return unwrapData(response);
}

export async function updateWorkspaceSettings(
  changes: UpdateWorkspaceSettings,
) {
  const response = await apiClient.patch<WorkspaceSettingsResponse>(
    "/settings",
    changes,
    { access: { permission: "settings.update" } },
  );
  return unwrapData(response);
}

export async function fetchEffectiveWorkspaceSettings(signal?: AbortSignal) {
  const response = await apiClient.get<EffectiveWorkspaceSettings>(
    "/settings/effective",
    { signal },
  );
  return unwrapData(response);
}
