import {
  dashboardNavigationSections,
  supportNavigationItem,
  type DashboardNavigationItem,
} from "./dashboardNavigation";
import { normalizeAccess } from "../utils/auth/accessAdapter";
import { permits } from "../utils/auth/accessPolicy";

export type QuickNavigationItem = Extract<
  DashboardNavigationItem,
  { href: unknown }
>;

export const quickNavigationItems = [
  ...dashboardNavigationSections[0].items.map((item, index) =>
    index === 0 ? { ...item, label: "Inquiries" } : item,
  ),
  { ...dashboardNavigationSections[1].items[0], label: "Analytics" },
  { ...dashboardNavigationSections[1].items[1], label: "Map" },
  { ...supportNavigationItem, label: "Support" },
] as const satisfies readonly QuickNavigationItem[];

export function getQuickNavigationItems(
  user: unknown,
): readonly QuickNavigationItem[] {
  const access = normalizeAccess(user);
  return quickNavigationItems.filter((item) =>
    permits(access, item.permission),
  );
}
