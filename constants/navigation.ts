import type { Href } from "expo-router";

export const appRoutes = {
  auth: {
    login: "/(auth)/login",
  },
  primary: {
    dashboard: "/(tabs)/dashboard",
    properties: "/(tabs)/properties",
    bookings: "/(tabs)/bookings",
    expenses: "/(tabs)/expenses",
  },
  secondary: {
    analytics: "/(secondary)/analytics",
    leases: "/(secondary)/leases",
    tenants: "/(secondary)/tenants",
    documents: "/(secondary)/documents",
    profile: "/(secondary)/profile",
    settings: "/(secondary)/settings",
    map: "/(secondary)/mapCanvas",
    notifications: "/(secondary)/notificationScreen",
    floorPlans: "/(secondary)/floorplans",
    assignedRooms: "/(secondary)/assigned-rooms",
  },
} as const;

const moduleRoutes: Record<string, Href> = {
  analytics: appRoutes.secondary.analytics,
  bookings: appRoutes.primary.bookings,
  dashboard: appRoutes.primary.dashboard,
  documents: appRoutes.secondary.documents,
  expenses: appRoutes.primary.expenses,
  floorplans: appRoutes.secondary.floorPlans,
  leases: appRoutes.secondary.leases,
  mapCanvas: appRoutes.secondary.map,
  notificationScreen: appRoutes.secondary.notifications,
  profile: appRoutes.secondary.profile,
  properties: appRoutes.primary.properties,
  settings: appRoutes.secondary.settings,
  tenants: appRoutes.secondary.tenants,
};

function splitRoute(route: string) {
  const separatorIndex = route.search(/[?#]/);

  return {
    moduleName:
      separatorIndex >= 0 ? route.slice(0, separatorIndex) : route,
    suffix: separatorIndex >= 0 ? route.slice(separatorIndex) : "",
  };
}

export function resolveModuleRoute(route?: string | null): Href | null {
  if (!route) return null;

  if (route.startsWith("/(secondary)/")) {
    return route as Href;
  }

  const normalizedRoute = route
    .replace(/^\/\(tabs\)\//, "")
    .replace(/^\//, "");
  const { moduleName, suffix } = splitRoute(normalizedRoute);
  const moduleRoute = moduleRoutes[moduleName];

  return moduleRoute ? (`${moduleRoute}${suffix}` as Href) : null;
}
