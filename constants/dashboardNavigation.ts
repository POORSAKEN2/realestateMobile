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
    title: "Portfolio",
    items: [
      {
        label: "Public Listing",
        supportingText: "Manage published properties and units",
        badge: "Planned",
        icon: { family: "Ionicons", name: "globe-outline" },
      },
      {
        label: "Analytics & Reports",
        supportingText: "View performance and portfolio insights",
        href: appRoutes.secondary.analytics,
        icon: { family: "Ionicons", name: "analytics-outline" },
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
    title: "Account",
    items: [
      {
        label: "Team & Access",
        supportingText: "Manage managers and property access",
        badge: "Owner",
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
