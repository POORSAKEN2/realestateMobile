import type { Href } from "expo-router";

export const appRoutes = {
  auth: {
    login: "/(auth)/login" as Href,
  },
  primary: {
    dashboard: "/(tabs)/dashboard" as Href,
    properties: "/(tabs)/properties" as Href,
    expenses: "/(tabs)/expenses" as Href,
    tenants: "/(tabs)/tenants" as Href,
    profile: "/(tabs)/profile" as Href,
  },
  secondary: {
    analytics: "/(secondary)/analytics" as Href,
    bookings: "/(secondary)/bookings" as Href,
    bedspaces: "/(secondary)/bedspaces" as Href,
    leases: "/(secondary)/leases" as Href,
    documents: "/(secondary)/documents" as Href,
    profile: "/(secondary)/profile" as Href,
    settings: "/(secondary)/settings" as Href,
    staffManagement: "/(secondary)/staff-management" as Href,
    map: "/(secondary)/mapCanvas" as Href,
    notifications: "/(secondary)/notificationScreen" as Href,
    floorPlans: "/(secondary)/floorplans" as Href,
    floorAreas: "/(secondary)/floor-areas" as Href,
    assignedRooms: "/(secondary)/assigned-rooms" as Href,
    billing: "/(secondary)/billing" as Href,
    inquiries: "/(secondary)/inquiries" as Href,
    rent: "/(secondary)/rent" as Href,
    support: "/(secondary)/support" as Href,
  },
};

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
