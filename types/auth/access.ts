export type AppRole = "ADMIN" | "MANAGER";
export type Resource =
  | "properties"
  | "rooms"
  | "floorplans"
  | "areas"
  | "bedspaces"
  | "leases"
  | "bookings"
  | "clients"
  | "payments"
  | "expenses"
  | "documents"
  | "tenant-notes"
  | "leads"
  | "lessors"
  | "faqs";
export type ResourceAction =
  | "viewAny"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "archive"
  | "restore";
export type AppPermission =
  | "audit.view"
  | "audit.export"
  | `${Resource}.${ResourceAction}`
  | "dashboard.admin"
  | "dashboard.manager"
  | "staff.manage"
  | "billing.checkout"
  | "billing.viewEntitlement"
  | "expenses.approve"
  | "analytics.viewStats"
  | "notifications.viewAny"
  | "notifications.create"
  | "support-tickets.viewAny"
  | "search.viewAny"
  | "deletion.preview";

export interface AccessSnapshot {
  role?: AppRole;
  /** null means no server grant list; [] explicitly denies all. */
  permissions: readonly string[] | null;
  /** null is unknown, [] is unassigned. Neither grants manager access. */
  propertyIds: readonly string[] | null;
  propertyPermissions: Readonly<Record<string, readonly string[]>>;
}
