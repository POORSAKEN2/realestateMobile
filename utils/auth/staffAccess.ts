import { getAppRole, hasAppPermission } from "./accessPolicy";

export const getSessionRole = getAppRole;

export function canManageStaff(user: unknown) {
  return hasAppPermission(user, "staff.manage");
}
