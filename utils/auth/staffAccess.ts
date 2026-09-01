const STAFF_MANAGEMENT_ROLES = new Set(["ADMIN", "OWNER"]);

export function getSessionRole(user: unknown) {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return undefined;
  }

  const role = (user as { role?: unknown }).role;
  return typeof role === "string" ? role.toUpperCase() : undefined;
}

export function canManageStaff(user: unknown) {
  const role = getSessionRole(user);
  return role ? STAFF_MANAGEMENT_ROLES.has(role) : false;
}
