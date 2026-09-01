import { apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope, StaffManager, StaffOverview } from "../types";

type StaffManagerApi = {
  id?: string | number;
  name?: string;
  email?: string;
  status?: string;
  created_at?: string;
};

type StaffOverviewApi = {
  managers?: StaffManagerApi[];
  manager_count?: number;
  manager_limit?: number;
  can_invite?: boolean;
};

function normalizeManager(manager: StaffManagerApi): StaffManager {
  return {
    id: String(manager.id ?? ""),
    name: manager.name?.trim() || "Property manager",
    email: manager.email?.trim() || "No email available",
    status: manager.status === "pending" ? "pending" : "active",
    createdAt: manager.created_at,
  };
}

export async function fetchStaffOverview(
  accessToken?: string,
): Promise<StaffOverview> {
  const response = await apiClient.get<
    ApiEnvelope<StaffOverviewApi> | StaffOverviewApi
  >("/staff/managers", { headers: authHeaders(accessToken) });
  const overview = unwrapData(response);
  const managers = (overview.managers ?? []).map(normalizeManager);

  return {
    managers,
    managerCount: overview.manager_count ?? managers.length,
    managerLimit: overview.manager_limit ?? 2,
    canInvite:
      overview.can_invite ??
      (overview.manager_count ?? managers.length) <
        (overview.manager_limit ?? 2),
  };
}
