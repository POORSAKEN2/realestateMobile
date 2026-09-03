export type AppRole = "ADMIN" | "MANAGER";

// Dashboard entry permissions mirror the backend permission matrix.
// Tenant records use clients.*; tenants.* manages organization accounts.
const SHARED_MODULE_PERMISSIONS = [
  "leads.viewAny",
  "leases.viewAny",
  "payments.viewAny",
  "expenses.viewAny",
  "documents.viewAny",
  "bookings.viewAny",
  "properties.viewAny",
  "clients.viewAny",
  "analytics.viewStats",
  "billing.viewEntitlement",
  "notifications.viewAny",
  "support-tickets.viewAny",
] as const;

export type AppPermission =
  | (typeof SHARED_MODULE_PERMISSIONS)[number]
  | "billing.checkout"
  | "dashboard.admin"
  | "dashboard.manager"
  | "expenses.approve"
  | "staff.manage";

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<AppPermission>> = {
  ADMIN: new Set([
    ...SHARED_MODULE_PERMISSIONS,
    "billing.checkout",
    "dashboard.admin",
    "expenses.approve",
    "staff.manage",
  ]),
  MANAGER: new Set([...SHARED_MODULE_PERMISSIONS, "dashboard.manager"]),
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
