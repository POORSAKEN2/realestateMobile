import type { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";

import type { AppPermission } from "../utils/auth/accessPolicy";
import { appRoutes } from "./navigation";

export type DashboardNavigationIcon =
  | { family: "Ionicons"; name: keyof typeof Ionicons.glyphMap }
  | {
      family: "MaterialCommunityIcons";
      name: keyof typeof MaterialCommunityIcons.glyphMap;
    };

export type DashboardNavigationItem = {
  label: string;
  supportingText: string;
  badge?: string;
  icon: DashboardNavigationIcon;
} & (
  | { href: Href; permission: AppPermission }
  | { href?: never; permission?: never }
);

export type DashboardNavigationSection = {
  title: string;
  items: readonly DashboardNavigationItem[];
};

export const dashboardNavigationSections = [
  {
    title: "Operations",
    items: [
      {
        label: "Inquiries & Leads",
        supportingText: "Review listing leads and engagement",
        href: appRoutes.secondary.inquiries,
        permission: "leads.viewAny",
        icon: { family: "Ionicons", name: "chatbubbles-outline" },
      },
      {
        label: "Leases",
        supportingText: "Manage agreements and lease terms",
        href: appRoutes.secondary.leases,
        permission: "leases.viewAny",
        icon: { family: "Ionicons", name: "document-text-outline" },
      },
      {
        label: "Rent",
        supportingText: "Track collections and payment records",
        href: appRoutes.secondary.rent,
        permission: "payments.viewAny",
        icon: { family: "MaterialCommunityIcons", name: "cash-multiple" },
      },
      {
        label: "Expenses",
        supportingText: "Track portfolio operating costs",
        href: appRoutes.primary.expenses,
        permission: "expenses.viewAny",
        icon: { family: "Ionicons", name: "receipt-outline" },
      },
      {
        label: "Documents",
        supportingText: "Store property and tenant files",
        href: appRoutes.secondary.documents,
        permission: "documents.viewAny",
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
      {
        label: "Bookings",
        supportingText: "Manage transient property stays",
        href: appRoutes.secondary.bookings,
        permission: "bookings.viewAny",
        icon: { family: "Ionicons", name: "calendar-outline" },
      },
    ],
  },
  {
    title: "Portfolio Intelligence",
    items: [
      {
        label: "Analytics & Reports",
        supportingText: "View performance and portfolio insights",
        href: appRoutes.secondary.analytics,
        permission: "analytics.viewStats",
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
      {
        label: "Mapped Properties",
        supportingText: "View mapped properties and portfolio locations",
        href: appRoutes.secondary.map,
        permission: "properties.viewAny",
        icon: { family: "Ionicons", name: "map-outline" },
      },
      {
        label: "Public Listing",
        supportingText: "Manage published properties and units",
        badge: "Planned",
        icon: { family: "Ionicons", name: "globe-outline" },
      },
      {
        label: "AI Assistant",
        supportingText: "Ask questions and create reports",
        badge: "Planned",
        icon: { family: "MaterialCommunityIcons", name: "robot-outline" },
      },
    ],
  },
  {
    title: "Account & Organization",
    items: [
      {
        label: "Team & Access",
        supportingText: "Create property manager accounts",
        href: appRoutes.secondary.staffManagement,
        permission: "staff.manage",
        badge: "Admin",
        icon: { family: "Ionicons", name: "people-circle-outline" },
      },
      {
        label: "Plan & Billing",
        supportingText: "View subscription and property limits",
        href: appRoutes.secondary.billing,
        permission: "billing.viewEntitlement",
        icon: { family: "Ionicons", name: "card-outline" },
      },
      {
        label: "Notifications & Reminders",
        supportingText: "Review alerts and rent reminders",
        href: appRoutes.secondary.notifications,
        permission: "notifications.viewAny",
        icon: { family: "Ionicons", name: "notifications-outline" },
      },
      {
        label: "Support Center",
        supportingText: "Get product help & FAQs",
        href: appRoutes.secondary.support,
        permission: "support-tickets.viewAny",
        icon: { family: "Ionicons", name: "help-buoy-outline" },
      },
    ],
  },
] as const satisfies readonly DashboardNavigationSection[];

export const managerDashboardNavigationSections = [
  {
    title: "Workspace",
    items: [
      {
        label: "Inquiries & Leads",
        supportingText: "Review listing leads and engagement",
        href: appRoutes.secondary.inquiries,
        permission: "leads.viewAny",
        icon: { family: "Ionicons", name: "chatbubbles-outline" },
      },
      {
        label: "Leases",
        supportingText: "Manage agreements and lease terms",
        href: appRoutes.secondary.leases,
        permission: "leases.viewAny",
        icon: { family: "Ionicons", name: "document-text-outline" },
      },
      {
        label: "Rent",
        supportingText: "Track collections and payment records",
        href: appRoutes.secondary.rent,
        permission: "payments.viewAny",
        icon: { family: "MaterialCommunityIcons", name: "cash-multiple" },
      },
      {
        label: "Expenses",
        supportingText: "Record and review operating costs",
        href: appRoutes.primary.expenses,
        permission: "expenses.viewAny",
        icon: { family: "Ionicons", name: "receipt-outline" },
      },
      {
        label: "Documents",
        supportingText: "Manage property and tenant files",
        href: appRoutes.secondary.documents,
        permission: "documents.viewAny",
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
      {
        label: "Bookings",
        supportingText: "Manage transient property stays",
        href: appRoutes.secondary.bookings,
        permission: "bookings.viewAny",
        icon: { family: "Ionicons", name: "calendar-outline" },
      },
      // {
      //   label: "Properties",
      //   supportingText: "View and manage portfolio properties",
      //   href: appRoutes.primary.properties,
      //   permission: "properties.viewAny",
      //   icon: { family: "MaterialCommunityIcons", name: "office-building" },
      // },
      // {
      //   label: "Tenants",
      //   supportingText: "View tenant records and activity",
      //   href: appRoutes.primary.tenants,
      //   permission: "clients.viewAny",
      //   icon: { family: "Ionicons", name: "people-outline" },
      // },
      {
        label: "Mapped Properties",
        supportingText: "Open portfolio locations on the map",
        href: appRoutes.secondary.map,
        permission: "properties.viewAny",
        icon: { family: "Ionicons", name: "map-outline" },
      },
      {
        label: "Analytics",
        supportingText: "Review portfolio performance",
        href: appRoutes.secondary.analytics,
        permission: "analytics.viewStats",
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
      {
        label: "Plan Details",
        supportingText: "View organization plan and limits",
        href: appRoutes.secondary.billing,
        permission: "billing.viewEntitlement",
        badge: "View only",
        icon: { family: "Ionicons", name: "card-outline" },
      },
      {
        label: "Notifications",
        supportingText: "Review alerts and reminders",
        href: appRoutes.secondary.notifications,
        permission: "notifications.viewAny",
        icon: { family: "Ionicons", name: "notifications-outline" },
      },
      {
        label: "Support Center",
        supportingText: "Browse help or submit a ticket",
        href: appRoutes.secondary.support,
        permission: "support-tickets.viewAny",
        icon: { family: "Ionicons", name: "help-buoy-outline" },
      },
    ],
  },
] as const satisfies readonly DashboardNavigationSection[];
