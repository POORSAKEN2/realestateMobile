import type { ApiError } from "../../api/errors";

const listeners = new Map<(error: ApiError) => void, number>();
export function reportEntitlementLimit(error: ApiError) {
  // The visible form's modal hosts its own prompt so iOS presents from the
  // active native surface. The app-level prompt handles all other requests.
  const listener = [...listeners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  listener?.(error);
}
export function subscribeEntitlementLimit(listener: (error: ApiError) => void, priority = 0) {
  listeners.set(listener, priority);
  return () => { listeners.delete(listener); };
}
