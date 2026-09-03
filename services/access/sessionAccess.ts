import type { AccessSnapshot } from "../../types/auth/access";
import { normalizeAccess } from "../../utils/auth/accessAdapter";
let current = { token: undefined as string | undefined, access: normalizeAccess(null), revision: 0 };
/** Keep the non-React API boundary in sync with the UI authorization snapshot. */
export function setSessionAccess(user: unknown, token?: string) {
  current = { token, access: normalizeAccess(user), revision: current.revision + 1 };
}
export function getSessionAccess(): Readonly<{ token?: string; access: AccessSnapshot; revision: number }> {
  return current;
}
