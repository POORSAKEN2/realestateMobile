import type { AppPermission } from "../../types/auth/access";

export const ROUTE_PERMISSIONS: Readonly<Record<string, AppPermission>> = {
  properties: "properties.viewAny", mapCanvas: "properties.viewAny", expenses: "expenses.viewAny",
  tenants: "clients.viewAny", leases: "leases.viewAny", rent: "payments.viewAny", documents: "documents.viewAny",
  bookings: "bookings.viewAny", floorplans: "floorplans.viewAny", "floor-areas": "areas.viewAny",
  "assigned-rooms": "rooms.viewAny", bedspaces: "bedspaces.viewAny", inquiries: "leads.viewAny",
  analytics: "analytics.viewStats", billing: "billing.viewEntitlement", notificationScreen: "notifications.viewAny",
  support: "support-tickets.viewAny", "staff-management": "staff.manage", "staff-manager-form": "staff.manage", "staff-manager-created": "staff.manage",
};
export const PROPERTY_ROUTES = new Set([
  "properties", "mapCanvas", "expenses", "tenants", "leases", "rent", "documents", "bookings",
  "floorplans", "floor-areas", "assigned-rooms", "bedspaces", "inquiries", "analytics",
]);
