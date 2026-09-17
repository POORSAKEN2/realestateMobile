import { API_BASE_URL } from "./config";
import { parseApiResponse } from "./response";

export type InvitationResolution = {
  name: string;
  email: string;
  role: "MANAGER";
  expires_at: string;
};

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const envelope = await parseApiResponse<{ data: T }>(
    response,
    "Invitation request failed.",
  );
  return envelope.data;
}
export const resolveStaffInvitation = (token: string) =>
  post<InvitationResolution>("/staff/invitations/resolve", { token });
export const acceptStaffInvitation = (token: string, password: string) =>
  post<{ email: string; accepted: true }>("/staff/invitations/accept", {
    token,
    password,
    password_confirmation: password,
  });
