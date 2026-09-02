import type { Href } from "expo-router";

export const appRoutes = {
  auth: {
    login: "/(auth)/login",
  },
  primary: {
    dashboard: "/(tabs)/dashboard",
    properties: "/(tabs)/properties",
    expenses: "/(tabs)/expenses",
    tenants: "/(tabs)/tenants",
    profile: "/(tabs)/profile",
  },
  secondary: {
    analytics: "/(secondary)/analytics",
    bookings: "/(secondary)/bookings",
    bedspaces: "/(secondary)/bedspaces",
    leases: "/(secondary)/leases",
    documents: "/(secondary)/documents",
    profile: "/(secondary)/profile",
    settings: "/(secondary)/settings",
    staffManagement: "/(secondary)/staff-management",
    staffManagerForm: "/(secondary)/staff-manager-form",
    staffManagerCreated: "/(secondary)/staff-manager-created",
    map: "/(secondary)/mapCanvas",
    notifications: "/(secondary)/notificationScreen",
    floorPlans: "/(secondary)/floorplans",
    floorAreas: "/(secondary)/floor-areas",
    assignedRooms: "/(secondary)/assigned-rooms",
    billing: "/(secondary)/billing",
    inquiries: "/(secondary)/inquiries",
    rent: "/(secondary)/rent",
    support: "/(secondary)/support",
  },
} as const;

const moduleRoutes: Record<string, Href> = {
  analytics: appRoutes.secondary.analytics,
  bookings: appRoutes.secondary.bookings,
  bedspaces: appRoutes.secondary.bedspaces,
  billing: appRoutes.secondary.billing,
  dashboard: appRoutes.primary.dashboard,
  documents: appRoutes.secondary.documents,
  expenses: appRoutes.primary.expenses,
  floorplans: appRoutes.secondary.floorPlans,
  "floor-areas": appRoutes.secondary.floorAreas,
  inquiries: appRoutes.secondary.inquiries,
  leases: appRoutes.secondary.leases,
  mapCanvas: appRoutes.secondary.map,
  notificationScreen: appRoutes.secondary.notifications,
  profile: appRoutes.primary.profile,
  properties: appRoutes.primary.properties,
  rent: appRoutes.secondary.rent,
  settings: appRoutes.secondary.settings,
  "staff-management": appRoutes.secondary.staffManagement,
  support: appRoutes.secondary.support,
  tenants: appRoutes.primary.tenants,
};

function splitRoute(route: string) {
  const separatorIndex = route.search(/[?#]/);

  return {
    moduleName: separatorIndex >= 0 ? route.slice(0, separatorIndex) : route,
    suffix: separatorIndex >= 0 ? route.slice(separatorIndex) : "",
  };
}

export function resolveModuleRoute(route?: string | null): Href | null {
  if (!route) return null;

  if (route.startsWith("/(secondary)/")) {
    return route as Href;
  }

  const normalizedRoute = route.replace(/^\/\(tabs\)\//, "").replace(/^\//, "");
  const { moduleName, suffix } = splitRoute(normalizedRoute);
  const moduleRoute = moduleRoutes[moduleName];

  return moduleRoute ? (`${moduleRoute}${suffix}` as Href) : null;
}
