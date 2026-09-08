import { Text, View, TouchableOpacity } from "react-native";
import { useMemo, useState } from "react";
import { Screen } from "../../components/ui/Screen";
import { SearchToolbar } from "../../components/ui/SearchToolbar";
import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import Feather from "@expo/vector-icons/Feather";
import { useProperties } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";
import { appRoutes } from "../../constants/navigation";
import { colors } from "../../constants/colors";
import PropertyImageGallery from "../../components/properties/PropertyImageGallery";
import { PortfolioAssetFilterSheet } from "../../components/properties/PortfolioAssetFilterSheet";
import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import { PropertyPortfolioSummary } from "../../components/properties/PropertyPortfolioSummary";
import { GlobalSearchModal } from "../../components/ui/GlobalSearchModal";
import { DashboardNavigationSections } from "../../components/dashboard/DashboardNavigationSections";
import { DashboardHero } from "../../components/dashboard/DashboardHero";
import { ManagerDashboardScreen } from "../../components/dashboard/ManagerDashboardScreen";
import { PortfolioAssetCard } from "../../components/dashboard/PortfolioAssetCard";
import { dashboardNavigationSections } from "../../constants/dashboardNavigation";
import { openModuleRoute } from "../../utils/navigation/moduleNavigation";
import {
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import {
  filterAndSortProperties,
  formatRole,
  getPropertyImages,
  isAuthUser,
  type AssetSortBy,
  type AssetSortOrder,
  type AssetStatusFilter,
} from "../../utils/dashboard/dashboardHelpers";
import { hasAppPermission } from "../../utils/auth/accessPolicy";

function AdminDashboardScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const loggedInUser = useMemo(
    () => (isAuthUser(session?.user) ? session.user : null),
    [session?.user],
  );
  const displayName = loggedInUser?.name?.trim() || "Signed in user";
  const displayRole = formatRole(loggedInUser?.role);
  const displayCompany = loggedInUser?.company?.trim();
  const displayEmail = loggedInUser?.email?.trim();
  const profileImageUri =
    loggedInUser?.profile_image_url ||
    loggedInUser?.profile_image ||
    loggedInUser?.profileImage ||
    loggedInUser?.avatar;
  const userSubtitle = displayCompany
    ? `${displayRole} at ${displayCompany}`
    : displayRole;
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [showAssetFilters, setShowAssetFilters] = useState(false);
  const [assetSortBy, setAssetSortBy] = useState<AssetSortBy>("value");
  const [assetSortOrder, setAssetSortOrder] = useState<AssetSortOrder>("desc");
  const [assetStatusFilter, setAssetStatusFilter] =
    useState<AssetStatusFilter>("ALL");
  const activeAssetFilterCount = [
    assetStatusFilter !== "ALL",
    assetSortBy !== "value",
    assetSortOrder !== "desc",
  ].filter(Boolean).length;
  const [imageGalleryProperty, setImageGalleryProperty] =
    useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { useList } = useProperties(accessToken);
  const {
    data: properties = [],
    isError: isPropertiesError,
    isLoading: isLoadingProperties,
    refetch: refetchProperties,
  } = useList();
  const portfolioValue = useMemo(
    () => properties.reduce((sum, property) => sum + property.value, 0),
    [properties],
  );
  const averageRoi = useMemo(() => {
    if (properties.length === 0) return 0;

    const totalRoi = properties.reduce(
      (sum, property) => sum + property.roi,
      0,
    );
    return totalRoi / properties.length;
  }, [properties]);
  const revenueGeneratingCount = useMemo(
    () =>
      properties.filter((property) => property.status === "REVENUE_GENERATING")
        .length,
    [properties],
  );
  const visibleAssets = useMemo(
    () =>
      filterAndSortProperties(
        properties,
        assetSearchQuery,
        assetStatusFilter,
        assetSortBy,
        assetSortOrder,
      ),
    [
      assetSearchQuery,
      assetSortBy,
      assetSortOrder,
      assetStatusFilter,
      properties,
    ],
  );
  return (
    <Screen
      bottomInset="tab-bar"
      className="flex-1 bg-surface"
      horizontalInset="none"
      topInset="safe-area"
    >
      <PullToRefreshFlatList
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        style={{ marginHorizontal: -24, marginTop: -24 }}
        contentInsetAdjustmentBehavior="never"
        data={isLoadingProperties ? [] : visibleAssets}
        keyExtractor={(property) => property.id}
        onRefresh={refetchProperties}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <View className="px-6 pt-6">
              <DashboardHero
                email={displayEmail}
                name={displayName}
                onNotificationsPress={() =>
                  openModuleRoute(appRoutes.secondary.notifications)
                }
                onSearchPress={() => setIsSearchModalOpen(true)}
                profileImageUri={profileImageUri}
                subtitle={userSubtitle}
              />

              <View className="z-10 -mt-32">
                <PropertyPortfolioSummary
                  averageRoi={averageRoi}
                  portfolioValue={portfolioValue}
                  propertyCount={properties.length}
                  revenueGeneratingCount={revenueGeneratingCount}
                  state={
                    isLoadingProperties
                      ? "loading"
                      : isPropertiesError
                        ? "error"
                        : "ready"
                  }
                />
              </View>
            </View>
            <View className="px-6">
              <DashboardNavigationSections
                sections={dashboardNavigationSections}
                onNavigate={openModuleRoute}
              />

              <View className="mb-4 mt-6">
                <Text className="font-ralewayBold text-xl">
                  Portfolio Assets
                </Text>

                <View className="mt-3 flex-row items-center gap-3">
                  <SearchToolbar
                    accessibilityLabel="Search portfolio assets"
                    activeFilterCount={activeAssetFilterCount}
                    className="flex-1"
                    clearAccessibilityLabel="Clear portfolio asset search"
                    filterAccessibilityLabel="Open portfolio asset filters"
                    onChangeText={setAssetSearchQuery}
                    onFilterPress={() => setShowAssetFilters(true)}
                    placeholder="Location or asset"
                    value={assetSearchQuery}
                  />

                  <TouchableOpacity
                    activeOpacity={0.8}
                    accessibilityLabel="Open property map"
                    accessibilityRole="button"
                    className="h-12 w-12 items-center justify-center rounded-2xl bg-primary"
                    onPress={() => openModuleRoute(appRoutes.secondary.map)}
                  >
                    <Feather name="map" color={colors.whitePrimary} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          isLoadingProperties ? (
            <View className="px-6">
              <SkeletonGroup
                accessibilityLabel="Loading portfolio assets"
                className="gap-3"
              >
                <SkeletonList
                  count={2}
                  renderItem={() => <SkeletonListCard className="min-h-24" />}
                />
              </SkeletonGroup>
            </View>
          ) : (
            <View className="px-6">
              <View className="items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/10 px-4 py-6">
                <Feather name="search" size={22} color={colors.primary} />
                <Text className="mt-2 font-ralewaySemiBold text-xs text-description">
                  No assets found
                </Text>
              </View>
            </View>
          )
        }
        renderItem={({ item: property }) => (
          <View className="px-6">
            <PortfolioAssetCard
              property={property}
              onOpen={setSelectedProperty}
              onOpenImages={setImageGalleryProperty}
            />
          </View>
        )}
      />

      <PortfolioAssetFilterSheet
        filters={{
          sortBy: assetSortBy,
          sortOrder: assetSortOrder,
          status: assetStatusFilter,
        }}
        onApply={(filters) => {
          setAssetSortBy(filters.sortBy);
          setAssetSortOrder(filters.sortOrder);
          setAssetStatusFilter(filters.status);
          setShowAssetFilters(false);
        }}
        onClose={() => setShowAssetFilters(false)}
        visible={showAssetFilters}
      />
      <PropertyDetailsModal
        accessToken={accessToken}
        onClose={() => setSelectedProperty(null)}
        property={selectedProperty}
      />
      {isSearchModalOpen ? (
        <GlobalSearchModal onClose={() => setIsSearchModalOpen(false)} />
      ) : null}
      {imageGalleryProperty ? (
        <PropertyImageGallery
          images={getPropertyImages(imageGalleryProperty)}
          onClose={() => setImageGalleryProperty(null)}
          title={imageGalleryProperty.title}
          visible={!!imageGalleryProperty}
        />
      ) : null}
    </Screen>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();

  if (hasAppPermission(session?.user, "dashboard.manager")) {
    return <ManagerDashboardScreen />;
  }

  if (hasAppPermission(session?.user, "dashboard.admin")) {
    return <AdminDashboardScreen />;
  }

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <View className="mt-8">
        <ModuleEmptyState
          description="Sign in again so the app can retrieve your account role."
          icon="shield-outline"
          title="Dashboard role unavailable"
        />
      </View>
    </Screen>
  );
}
