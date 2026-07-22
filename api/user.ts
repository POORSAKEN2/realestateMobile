import { API_BASE_URL, apiClient, authHeaders, unwrapData } from "./client";
import type { ApiEnvelope, AuthUser, UpdateUserProfilePayload } from "../types";

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
  formData.append("role", payload.role);
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
