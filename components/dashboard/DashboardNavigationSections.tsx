import type { Href } from "expo-router";
import { Text, View } from "react-native";

import { NavigationTile } from "../navigation/NavigationTile";
import type { DashboardNavigationSection } from "../../constants/dashboardNavigation";
import { useAuth } from "../../hooks/useAuth";
import { hasAppPermission } from "../../utils/auth/accessPolicy";

type DashboardNavigationSectionsProps = {
  sections: readonly DashboardNavigationSection[];
  onNavigate: (href: Href) => void;
};

export function DashboardNavigationSections({
  sections,
  onNavigate,
}: DashboardNavigationSectionsProps) {
  const { session } = useAuth();
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.href === undefined ||
          hasAppPermission(session?.user, item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) return null;

  return (
    <View className="mt-6 gap-6">
      {visibleSections.map((section) => (
        <View key={section.title}>
          <Text className="mb-3 font-ralewayBold text-xl text-textPrimary">
            {section.title}
          </Text>
          <View className="-mx-1.5 flex-row flex-wrap">
            {section.items.map((item) => (
              <View key={item.label} className="w-1/4 px-1.5 pb-4">
                <NavigationTile item={item} onNavigate={onNavigate} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
