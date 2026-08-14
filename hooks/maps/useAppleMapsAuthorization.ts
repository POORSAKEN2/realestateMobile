import { useCallback } from "react";

import { useAuth } from "../useAuth";
import { appleMapsTokenManager } from "../../services/maps/appleMapsTokenManager";

export function useAppleMapsAuthorization() {
  const { isAuthenticated, session } = useAuth();
  const accessToken = session?.accessToken;

  return useCallback(
    (forceRefresh = false) => {
      if (!isAuthenticated || !accessToken) {
        return Promise.reject(
          new Error("An authenticated session is required for Apple Maps."),
        );
      }

      return appleMapsTokenManager.getToken(accessToken, { forceRefresh });
    },
    [accessToken, isAuthenticated],
  );
}
