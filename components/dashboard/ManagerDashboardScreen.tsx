import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

import { managerDashboardNavigationSections } from "../../constants/dashboardNavigation";
import { appRoutes } from "../../constants/navigation";
import { useProperties } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";
import { formatRole, isAuthUser } from "../../utils/dashboard/dashboardHelpers";
import { openModuleRoute } from "../../utils/navigation/moduleNavigation";
import { GlobalSearchModal } from "../ui/GlobalSearchModal";
import { Screen } from "../ui/Screen";
import { DashboardHero } from "./DashboardHero";
import { DashboardNavigationSections } from "./DashboardNavigationSections";
import { DashboardSummaryCard } from "./DashboardSummaryCard";

function AccessItem({
  description,
  icon,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="flex-row items-start py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons name={icon} color="#8A77F4" size={18} />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <Text className="font-ralewayBold text-sm text-textPrimary">
          {title}
        </Text>
        <Text className="mt-0.5 text-xs leading-5 text-description">
          {description}
        </Text>
      </View>
    </View>
  );
}

export function ManagerDashboardScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const user = isAuthUser(session?.user) ? session.user : null;
  const displayName = user?.name?.trim() || "Signed in user";
  const displayRole = formatRole(user?.role);
  const displayCompany = user?.company?.trim();
  const displayEmail = user?.email?.trim();
  const profileImageUri =
    user?.profile_image_url ||
    user?.profile_image ||
    user?.profileImage ||
    user?.avatar;
  const userSubtitle = displayCompany
    ? `${displayRole} at ${displayCompany}`
    : displayRole;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { useList } = useProperties(accessToken);
  const propertiesQuery = useList();
  const properties = propertiesQuery.data ?? [];

  const portfolioMetrics = useMemo(() => {
    const revenueGenerating = properties.filter(
      (property) => property.status === "REVENUE_GENERATING",
    ).length;
    const inProgress = properties.filter(
      (property) => property.status === "UNDER_CONSTRUCTION",
    ).length;

    return { inProgress, revenueGenerating };
  }, [properties]);

  return (
    <Screen bottomInset="tab-bar" className="bg-surface" horizontalInset="none">
      <View className="flex-1">
        <DashboardHero
          email={displayEmail}
          name={displayName}
          onNotificationsPress={() =>
            openModuleRoute(appRoutes.secondary.notifications)
          }
          onSearchPress={() => setIsSearchOpen(true)}
          profileImageUri={profileImageUri}
          subtitle={userSubtitle}
        />

        <View className="z-10 -mt-32">
          <DashboardSummaryCard
            badge="Manager overview"
            icon="office-building-outline"
            label="Portfolio properties"
            metrics={[
              {
                icon: "office-building-outline",
                label: "Revenue generating",
                tone: "success",
                value: propertiesQuery.isError
                  ? "—"
                  : String(portfolioMetrics.revenueGenerating),
              },
              {
                icon: "hammer-wrench",
                label: "Under construction",
                tone: "warning",
                value: propertiesQuery.isError
                  ? "—"
                  : String(portfolioMetrics.inProgress),
              },
            ]}
            state={
              propertiesQuery.isLoading
                ? "loading"
                : propertiesQuery.isError
                  ? "error"
                  : "ready"
            }
            subtitle={
              propertiesQuery.isError
                ? "Portfolio unavailable"
                : properties.length === 1
                  ? "Property assigned"
                  : "Properties assigned"
            }
            value={
              propertiesQuery.isError
                ? "Unavailable"
                : String(properties.length)
            }
            variant="manager"
          />
        </View>

        <ScrollView
          className="-mx-6 flex-1"
          contentContainerClassName="px-6 pb-36"
          refreshControl={
            <RefreshControl
              colors={["#8A77F4"]}
              onRefresh={() => void propertiesQuery.refetch()}
              refreshing={propertiesQuery.isFetching}
              tintColor="#8A77F4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <DashboardNavigationSections
            onNavigate={openModuleRoute}
            sections={managerDashboardNavigationSections}
          />

          <View className="mt-2 rounded-[24px] border border-primary/15 bg-white px-4 py-2 shadow-sm shadow-primary/5">
            <AccessItem
              description="Create and update operational records permitted by the Manager role."
              icon="create-outline"
              title="Operational access"
            />
            <View className="h-px bg-primary/10" />
            <AccessItem
              description="Plan details remain visible, but only administrators can start checkout."
              icon="card-outline"
              title="Billing is view-only"
            />
            <View className="h-px bg-primary/10" />
            <AccessItem
              description="Expense approval and staff provisioning are hidden from this workspace."
              icon="lock-closed-outline"
              title="Admin controls protected"
            />
          </View>
        </ScrollView>
      </View>

      <GlobalSearchModal
        isVisible={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </Screen>
  );
}
