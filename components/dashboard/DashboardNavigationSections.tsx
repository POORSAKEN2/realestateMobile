import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type {
  DashboardNavigationIcon,
  DashboardNavigationItem,
  DashboardNavigationSection,
} from "../../constants/dashboardNavigation";
import { useAuth } from "../../hooks/useAuth";
import { hasAppPermission } from "../../utils/auth/accessPolicy";

type DashboardNavigationSectionsProps = {
  sections: readonly DashboardNavigationSection[];
  onNavigate: (href: Href) => void;
};

function NavigationIcon({ icon }: { icon: DashboardNavigationIcon }) {
  if (icon.family === "Ionicons") {
    return <Ionicons name={icon.name} size={29} color={colors.primary} />;
  }

  return (
    <MaterialCommunityIcons name={icon.name} size={30} color={colors.primary} />
  );
}

function NavigationButton({
  item,
  onNavigate,
}: {
  item: DashboardNavigationItem;
  onNavigate: (href: Href) => void;
}) {
  const href = item.href;
  const isAvailable = Boolean(href);

  return (
    <TouchableOpacity
      accessibilityLabel={
        isAvailable ? `Open ${item.label}` : `${item.label}, unavailable`
      }
      accessibilityHint={item.supportingText}
      accessibilityRole="button"
      accessibilityState={{ disabled: !isAvailable }}
      activeOpacity={0.78}
      className={`w-full items-center ${isAvailable ? "" : "opacity-50"}`}
      disabled={!isAvailable}
      onPress={href ? () => onNavigate(href) : undefined}
    >
      <View className="h-16 w-16 items-center justify-center rounded-[22px] border border-primary/30 bg-white">
        <NavigationIcon icon={item.icon} />
      </View>

      <Text
        className="mt-2 min-h-8 w-full text-center font-ralewaySemiBold text-xs leading-4 text-textPrimary"
        numberOfLines={2}
      >
        {item.label}
      </Text>

      {item.badge ? (
        <View className="h-5 w-full items-center justify-center rounded-lg bg-accent px-1">
          <Text
            className="font-ralewayExtraBold text-[8px] uppercase tracking-wide text-textPrimary"
            numberOfLines={1}
          >
            {item.badge}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

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
          <Text className="mb-3 font-ralewayBold text-xl">{section.title}</Text>
          <View className="-mx-1.5 flex-row flex-wrap">
            {section.items.map((item) => (
              <View key={item.label} className="w-1/4 px-1.5 pb-4">
                <NavigationButton item={item} onNavigate={onNavigate} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
