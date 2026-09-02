import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";

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
  href?: Href;
  badge?: string;
  icon: DashboardNavigationIcon;
};

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
        icon: { family: "Ionicons", name: "chatbubbles-outline" },
      },
      {
        label: "Leases",
        supportingText: "Manage agreements and lease terms",
        href: appRoutes.secondary.leases,
        icon: { family: "Ionicons", name: "document-text-outline" },
      },
      {
        label: "Rent",
        supportingText: "Track collections and payment records",
        href: appRoutes.secondary.rent,
        icon: { family: "MaterialCommunityIcons", name: "cash-multiple" },
      },
      {
        label: "Expenses",
        supportingText: "Track portfolio operating costs",
        href: appRoutes.primary.expenses,
        icon: { family: "Ionicons", name: "receipt-outline" },
      },
      {
        label: "Documents",
        supportingText: "Store property and tenant files",
        href: appRoutes.secondary.documents,
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
      {
        label: "Bookings",
        supportingText: "Manage transient property stays",
        href: appRoutes.secondary.bookings,
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
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
      {
        label: "Mapped Properties",
        supportingText: "View mapped properties and portfolio locations",
        href: appRoutes.secondary.map,
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
        badge: "Admin",
        icon: { family: "Ionicons", name: "people-circle-outline" },
      },
      {
        label: "Plan & Billing",
        supportingText: "View subscription and property limits",
        href: appRoutes.secondary.billing,
        icon: { family: "Ionicons", name: "card-outline" },
      },
      {
        label: "Notifications & Reminders",
        supportingText: "Review alerts and rent reminders",
        href: appRoutes.secondary.notifications,
        icon: { family: "Ionicons", name: "notifications-outline" },
      },
      {
        label: "Support Center",
        supportingText: "Get product help & FAQs",
        href: appRoutes.secondary.support,
        icon: { family: "Ionicons", name: "help-buoy-outline" },
      },
    ],
  },
] as const satisfies readonly DashboardNavigationSection[];

export const managerDashboardNavigationSections = [
  {
    title: "Daily Operations",
    items: [
      {
        label: "Inquiries & Leads",
        supportingText: "Review listing leads and engagement",
        href: appRoutes.secondary.inquiries,
        icon: { family: "Ionicons", name: "chatbubbles-outline" },
      },
      {
        label: "Leases",
        supportingText: "Manage agreements and lease terms",
        href: appRoutes.secondary.leases,
        icon: { family: "Ionicons", name: "document-text-outline" },
      },
      {
        label: "Rent",
        supportingText: "Track collections and payment records",
        href: appRoutes.secondary.rent,
        icon: { family: "MaterialCommunityIcons", name: "cash-multiple" },
      },
      {
        label: "Expenses",
        supportingText: "Record and review operating costs",
        href: appRoutes.primary.expenses,
        icon: { family: "Ionicons", name: "receipt-outline" },
      },
      {
        label: "Documents",
        supportingText: "Manage property and tenant files",
        href: appRoutes.secondary.documents,
        icon: {
          family: "MaterialCommunityIcons",
          name: "file-document-outline",
        },
      },
      {
        label: "Bookings",
        supportingText: "Manage transient property stays",
        href: appRoutes.secondary.bookings,
        icon: { family: "Ionicons", name: "calendar-outline" },
      },
    ],
  },
  {
    title: "Portfolio Workspace",
    items: [
      {
        label: "Properties",
        supportingText: "View and manage portfolio properties",
        href: appRoutes.primary.properties,
        icon: { family: "MaterialCommunityIcons", name: "office-building" },
      },
      {
        label: "Tenants",
        supportingText: "View tenant records and activity",
        href: appRoutes.primary.tenants,
        icon: { family: "Ionicons", name: "people-outline" },
      },
      {
        label: "Mapped Properties",
        supportingText: "Open portfolio locations on the map",
        href: appRoutes.secondary.map,
        icon: { family: "Ionicons", name: "map-outline" },
      },
      {
        label: "Analytics",
        supportingText: "Review portfolio performance",
        href: appRoutes.secondary.analytics,
        icon: { family: "Ionicons", name: "analytics-outline" },
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Plan Details",
        supportingText: "View organization plan and limits",
        href: appRoutes.secondary.billing,
        badge: "View only",
        icon: { family: "Ionicons", name: "card-outline" },
      },
      {
        label: "Notifications",
        supportingText: "Review alerts and reminders",
        href: appRoutes.secondary.notifications,
        icon: { family: "Ionicons", name: "notifications-outline" },
      },
      {
        label: "Support Center",
        supportingText: "Browse help or submit a ticket",
        href: appRoutes.secondary.support,
        icon: { family: "Ionicons", name: "help-buoy-outline" },
      },
    ],
  },
] as const satisfies readonly DashboardNavigationSection[];
