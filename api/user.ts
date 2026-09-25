import { normalizeAccess } from "../utils/auth/accessAdapter";
import {
  normalizeAccountDeletion,
  normalizeAccountDeletionPage,
} from "../utils/accountDeletion/accountDeletion";
import { API_BASE_URL, apiClient, authHeaders, unwrapData } from "./client";
import type {
  AccountDeletionPage,
  AccountDeletionRequest,
  ApiEnvelope,
  AuthUser,
  DeletionAction,
  DeletionScope,
  DeletionStatus,
  UpdateUserProfilePayload,
} from "../types";

function getAbsoluteStorageUrl(path?: string | null) {
  if (!path) return "";

  const raw = path.trim();
  if (!raw) return "";

  const apiUrl = API_BASE_URL || "http://localhost:8000/api";
  const backendOrigin = apiUrl.replace(/\/api\/?$/, "");

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);

      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        return `${backendOrigin}${url.pathname}`;
      }
    } catch {
      return raw;
    }

    return raw;
  }

  if (raw.startsWith("/storage/")) return `${backendOrigin}${raw}`;
  if (raw.startsWith("storage/")) return `${backendOrigin}/${raw}`;

  return `${backendOrigin}/storage/${raw.replace(/^\/+/, "")}`;
}

export function normalizeUser(user: AuthUser): AuthUser {
  const profileImageUrl =
    getAbsoluteStorageUrl(user.profile_image_url) ||
    getAbsoluteStorageUrl(user.profile_image) ||
    getAbsoluteStorageUrl(user.profileImage) ||
    getAbsoluteStorageUrl(user.avatar);

  return {
    ...user,
    ...(user.access ||
    user.permissions !== undefined ||
    user.assigned_property_ids !== undefined ||
    user.property_permissions !== undefined
      ? { access: normalizeAccess(user) }
      : {}),
    job_title: user.job_title ?? user.jobTitle ?? user.role,
    jobTitle: user.jobTitle ?? user.job_title ?? user.role,
    profile_image_url: profileImageUrl || user.profile_image_url,
    profileImage: profileImageUrl || user.profileImage,
    avatar: profileImageUrl || user.avatar,
  };
}

export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
  accessToken?: string,
) {
  const formData = new FormData();

  formData.append("_method", "PUT");
  formData.append("name", payload.name);
  formData.append("company", payload.company);
  formData.append("phone", payload.phone);

  if (payload.profileImage) {
    formData.append(
      "profile_image",
      (payload.profileImage.file ?? {
        uri: payload.profileImage.uri,
        name: payload.profileImage.name,
        type: payload.profileImage.type,
      }) as unknown as Blob,
    );
  }

  const response = await apiClient.post<ApiEnvelope<AuthUser> | AuthUser>(
    "/user?_method=PUT",
    formData,
    { headers: authHeaders(accessToken) },
  );

  return normalizeUser(unwrapData<AuthUser>(response));
}

export async function changePassword(
  payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  },
  accessToken?: string,
) {
  const response = await apiClient.post<{
    success?: boolean;
    message?: string;
  }>("/user/change-password", payload, { headers: authHeaders(accessToken) });

  return response;
}

export async function requestAccountDeletion(
  payload: { reason?: string; confirmation: boolean; current_password: string },
  accessToken?: string,
) {
  const response = await apiClient.post<ApiEnvelope<AccountDeletionRequest>>(
    "/account/deletion-request",
    payload,
    {
      headers: authHeaders(accessToken),
      access: { permission: "account.requestDeletion" },
    },
  );

  return normalizeAccountDeletion(unwrapData(response));
}

export async function fetchAccountDeletionRequest(): Promise<AccountDeletionRequest | null> {
  const deletion = unwrapData(
    await apiClient.get<ApiEnvelope<AccountDeletionRequest | null>>(
      "/account/deletion-request",
      { access: { permission: "account.requestDeletion" } },
    ),
  );
  return deletion ? normalizeAccountDeletion(deletion) : null;
}

export async function respondToAccountDeletion(
  id: string,
  payload: { current_password: string; response: string },
) {
  return normalizeAccountDeletion(
    unwrapData(
      await apiClient.post<ApiEnvelope<AccountDeletionRequest>>(
        `/account/deletion-request/${encodeURIComponent(id)}/response`,
        payload,
        { access: { permission: "account.requestDeletion" } },
      ),
    ),
  );
}

export async function cancelAccountDeletion(id: string) {
  return normalizeAccountDeletion(
    unwrapData(
      await apiClient.post<ApiEnvelope<AccountDeletionRequest>>(
        `/account/deletion-request/${encodeURIComponent(id)}/cancel`,
        undefined,
        { access: { permission: "account.requestDeletion" } },
      ),
    ),
  );
}

export async function fetchAccountDeletionQueue(
  filters: {
    status?: DeletionStatus;
    scope?: DeletionScope;
    page?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.scope) params.set("scope", filters.scope);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  const query = params.toString();
  return normalizeAccountDeletionPage(
    unwrapData(
      await apiClient.get<ApiEnvelope<AccountDeletionPage>>(
        `/admin/deletion-requests${query ? `?${query}` : ""}`,
        { access: { permission: "account.reviewDeletionRequests" } },
      ),
    ),
  );
}

export async function fetchAccountDeletionDetail(id: string) {
  return normalizeAccountDeletion(
    unwrapData(
      await apiClient.get<ApiEnvelope<AccountDeletionRequest>>(
        `/admin/deletion-requests/${encodeURIComponent(id)}`,
        { access: { permission: "account.reviewDeletionRequests" } },
      ),
    ),
  );
}

export async function decideAccountDeletion(
  id: string,
  payload: {
    action: Extract<
      DeletionAction,
      "approve" | "reject" | "request_information"
    >;
    reason?: string;
    confirmation?: boolean;
  },
) {
  return normalizeAccountDeletion(
    unwrapData(
      await apiClient.post<ApiEnvelope<AccountDeletionRequest>>(
        `/admin/deletion-requests/${encodeURIComponent(id)}/decision`,
        payload,
        { access: { permission: "account.reviewDeletionRequests" } },
      ),
    ),
  );
}

export async function retryAccountDeletion(id: string) {
  return normalizeAccountDeletion(
    unwrapData(
      await apiClient.post<ApiEnvelope<AccountDeletionRequest>>(
        `/admin/deletion-requests/${encodeURIComponent(id)}/retry`,
        undefined,
        { access: { permission: "account.reviewDeletionRequests" } },
      ),
    ),
  );
}

export async function exportUserData(accessToken?: string) {
  const response = await apiClient.get<Record<string, unknown>>(
    "/account/data-export",
    { headers: authHeaders(accessToken) },
  );

  return unwrapData(response);
}

export async function fetchCurrentUser(accessToken: string): Promise<AuthUser> {
  const response = await apiClient.get<ApiEnvelope<AuthUser> | AuthUser>(
    "/user",
    { headers: authHeaders(accessToken) },
  );
  return normalizeUser(unwrapData(response));
}
