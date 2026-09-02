export type AppRole = "ADMIN" | "MANAGER";

export type AppPermission =
  | "billing.checkout"
  | "dashboard.admin"
  | "dashboard.manager"
  | "expenses.approve"
  | "staff.manage";

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<AppPermission>> = {
  ADMIN: new Set([
    "billing.checkout",
    "dashboard.admin",
    "expenses.approve",
    "staff.manage",
  ]),
  MANAGER: new Set(["dashboard.manager"]),
};

function readRole(user: unknown) {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return undefined;
  }

  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role.trim().toUpperCase() : undefined;
}

export function getAppRole(user: unknown): AppRole | undefined {
  const role = readRole(user);
  return role === "ADMIN" || role === "MANAGER" ? role : undefined;
}

export function hasAppPermission(user: unknown, permission: AppPermission) {
  const role = getAppRole(user);
  return role ? ROLE_PERMISSIONS[role].has(permission) : false;
}
