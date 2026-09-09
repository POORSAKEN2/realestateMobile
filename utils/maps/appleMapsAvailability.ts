import { ApiError } from "../../api/errors";

export const APPLE_MAPS_UNAVAILABLE_CODE = "apple_maps_unavailable";

export function isAppleMapsUnavailableError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === APPLE_MAPS_UNAVAILABLE_CODE
  );
}
