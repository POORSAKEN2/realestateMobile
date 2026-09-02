import { apiClient, authHeaders, unwrapData } from "./client";
import type {
  ApiEnvelope,
  CreateStaffManagerPayload,
  StaffManager,
} from "../types";

type StaffManagerApi = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  created_at?: string;
};

function normalizeManager(manager: StaffManagerApi): StaffManager {
  return {
    id: String(manager.id ?? ""),
    name: manager.name?.trim() || "Property manager",
    email: manager.email?.trim() || "No email available",
    role: "MANAGER",
    createdAt: manager.created_at,
  };
}

export async function createStaffManager(
  payload: CreateStaffManagerPayload,
  accessToken?: string,
): Promise<StaffManager> {
  const response = await apiClient.post<
    ApiEnvelope<StaffManagerApi> | StaffManagerApi
  >(
    "/users",
    {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: "MANAGER",
    },
    { headers: authHeaders(accessToken) },
  );

  return normalizeManager(unwrapData(response));
}
