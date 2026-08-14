import { apiClient, authHeaders } from "./client";

export type AppleMapsTokenResponse = Readonly<{
  token: string;
  expires_at: number;
  expires_in: number;
  token_type: "Bearer";
}>;

export interface AppleMapsTokenGateway {
  fetchToken(accessToken: string): Promise<AppleMapsTokenResponse>;
}

function validateTokenResponse(
  response: AppleMapsTokenResponse,
): AppleMapsTokenResponse {
  const token = response.token?.trim();

  if (
    !token ||
    !Number.isFinite(response.expires_at) ||
    !Number.isFinite(response.expires_in) ||
    response.expires_at <= 0 ||
    response.expires_in <= 0 ||
    response.token_type !== "Bearer"
  ) {
    throw new Error("Apple Maps token endpoint returned an invalid response.");
  }

  return { ...response, token };
}

export async function fetchAppleMapsToken(
  accessToken: string,
): Promise<AppleMapsTokenResponse> {
  if (!accessToken.trim()) {
    throw new Error("An authenticated session is required for Apple Maps.");
  }

  const response = await apiClient.get<AppleMapsTokenResponse>(
    "/apple-maps/token",
    { headers: authHeaders(accessToken) },
  );

  return validateTokenResponse(response);
}

export const appleMapsTokenGateway: AppleMapsTokenGateway = {
  fetchToken: fetchAppleMapsToken,
};
