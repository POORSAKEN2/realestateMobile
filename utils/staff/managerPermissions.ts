import type { AppPermission, Resource } from "../../types/auth/access";
export const MANAGER_PERMISSION_GROUPS: Array<{ label: string; options: Array<{ label: string; grants: AppPermission[] }> }> = (
  [["properties", "Properties"], ["leases", "Leases"], ["bookings", "Bookings"], ["clients", "Tenants"],
   ["rooms", "Rooms"], ["floorplans", "Floor plans"], ["areas", "Floor areas"], ["bedspaces", "Bedspaces"],
   ["documents", "Documents"], ["payments", "Payments"], ["expenses", "Expenses"], ["leads", "Inquiries"], ["tenant-notes", "Tenant notes"]] as Array<[Resource, string]>
).map(([resource, label]) => ({ label, options: [
  { label: "View", grants: [`${resource}.viewAny`, `${resource}.view`] as AppPermission[] },
  ...(["create", "update", "delete"] as const).filter((action) =>
    !(resource === "properties" && action === "create") && !(["payments", "expenses"].includes(resource) && action === "delete")
  ).map((action) => ({ label: action === "create" ? "Add" : action === "update" ? "Edit" : "Delete", grants: [`${resource}.${action}`] as AppPermission[] })),
] }));
export const DEFAULT_MANAGER_PERMISSIONS = [
  ...MANAGER_PERMISSION_GROUPS.flatMap((group) => group.options.flatMap((option) => option.grants)),
  "notifications.viewAny", "support-tickets.viewAny", "billing.viewEntitlement",
];
