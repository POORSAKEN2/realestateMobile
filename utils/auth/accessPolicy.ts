import type { AccessSnapshot, AppPermission, AppRole, Resource } from "../../types/auth/access";
import { normalizeAccess } from "./accessAdapter";
export type { AppPermission, AppRole } from "../../types/auth/access";

export const OPERATIONAL_RESOURCES: readonly Resource[] = [
  "properties", "rooms", "floorplans", "areas", "bedspaces", "leases", "bookings",
  "clients", "payments", "expenses", "documents", "tenant-notes", "leads",
];
const OWNER_ONLY = new Set<AppPermission>([
  "staff.manage", "dashboard.admin", "billing.checkout", "expenses.approve",
  "payments.delete", "expenses.delete", "properties.create",
]);
const SHARED = new Set<AppPermission>([
  "billing.viewEntitlement", "analytics.viewStats", "notifications.viewAny", "support-tickets.viewAny",
]);
export function getAppRole(user: unknown): AppRole | undefined {
  return normalizeAccess(user).role;
}
export function canAccessProperty(access: AccessSnapshot, propertyId: string) {
  return Boolean(propertyId) && (access.role === "ADMIN" ||
    access.role === "MANAGER" && access.propertyIds?.includes(String(propertyId)) === true);
}
export function permits(access: AccessSnapshot, permission: AppPermission, propertyId?: string): boolean {
  if (!access.role) return false;
  if (permission === "dashboard.manager") return access.role === "MANAGER";
  if (permission === "dashboard.admin") return access.role === "ADMIN";
  if (OWNER_ONLY.has(permission) && access.role !== "ADMIN") return false;
  const [resource, action] = permission.split(".");
  const known = OWNER_ONLY.has(permission) || SHARED.has(permission) ||
    OPERATIONAL_RESOURCES.includes(resource as Resource) && ["view", "viewAny", "create", "update", "delete"].includes(action);
  if (!known) return false;
  if (access.permissions !== null && !access.permissions.includes(permission)) return false;
  if (propertyId !== undefined) {
    if (!canAccessProperty(access, propertyId)) return false;
    const grants = access.propertyPermissions[propertyId];
    if (grants && !grants.includes(permission)) return false;
  }
  return true;
}
export function hasAppPermission(user: unknown, permission: AppPermission, propertyId?: string) {
  return permits(normalizeAccess(user), permission, propertyId);
}
