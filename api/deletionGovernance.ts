import { apiClient, authHeaders, unwrapData } from "./client";
import type {
  ApiEnvelope,
  DeletionImpact,
  GovernedResource,
} from "../types";
import type { AppPermission } from "../types/auth/access";
import { normalizeDeletionImpact } from "../utils/governance/deletionImpact";
export { deletionImpactFromError, normalizeDeletionImpact } from "../utils/governance/deletionImpact";

export async function fetchDeletionImpact(
  resource: GovernedResource,
  id: string,
  accessToken?: string,
  page = 1,
) {
  const response = await apiClient.get<ApiEnvelope<Record<string, any>> | Record<string, any>>(
    `/governance/deletion-impact/${resource}/${encodeURIComponent(id)}?page=${page}`,
    { headers: authHeaders(accessToken), access: { permission: "deletion.preview" } },
  );
  return normalizeDeletionImpact(unwrapData(response));
}

export async function executeGovernedAction(
  impact: DeletionImpact,
  accessToken?: string,
) {
  const { resource, id } = impact.target;
  const path =
    impact.action === "archive" && (resource === "properties" || resource === "documents")
      ? `/${resource}/${encodeURIComponent(id)}/archive`
      : `/${resource}/${encodeURIComponent(id)}`;
  const permission = `${resource}.archive` as AppPermission;
  if (impact.action === "archive" && (resource === "properties" || resource === "documents")) {
    await apiClient.post(path, undefined, { headers: authHeaders(accessToken), access: { permission } });
    return;
  }
  await apiClient.delete(path, {
    headers: authHeaders(accessToken),
    access: { permission: `${resource}.delete` as AppPermission },
  });
}

export async function restoreGovernedRecord(
  resource: "properties" | "documents",
  id: string,
  accessToken?: string,
) {
  const response = await apiClient.post<ApiEnvelope<Record<string, any>> | Record<string, any>>(
    `/${resource}/${encodeURIComponent(id)}/restore`,
    undefined,
    { headers: authHeaders(accessToken), access: { permission: `${resource}.restore` } },
  );
  return unwrapData(response);
}
