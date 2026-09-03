export type AppRole = "ADMIN" | "MANAGER";
export type Resource = "properties" | "rooms" | "floorplans" | "areas" | "bedspaces" | "leases" | "bookings" | "clients" | "payments" | "expenses" | "documents" | "tenant-notes" | "leads";
export type ResourceAction = "viewAny" | "view" | "create" | "update" | "delete";
export type AppPermission = `${Resource}.${ResourceAction}`
  | "dashboard.admin" | "dashboard.manager" | "staff.manage"
  | "billing.checkout" | "billing.viewEntitlement" | "expenses.approve"
  | "analytics.viewStats" | "notifications.viewAny" | "support-tickets.viewAny";

export interface AccessSnapshot {
  role?: AppRole;
  /** null means no server grant list; [] explicitly denies all. */
  permissions: readonly string[] | null;
  /** null is unknown, [] is unassigned. Neither grants manager access. */
  propertyIds: readonly string[] | null;
  propertyPermissions: Readonly<Record<string, readonly string[]>>;
}
