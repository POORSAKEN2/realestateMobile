import {
  FlatList,
  Image,
  ImageBackground,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from "react-native";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo, useState } from "react";
import { Screen } from "../../components/ui/Screen";
import { SearchToolbar } from "../../components/ui/SearchToolbar";
import Ionicons from "@expo/vector-icons/build/Ionicons";
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
import { PortfolioAssetCard } from "../../components/dashboard/PortfolioAssetCard";
import { dashboardNavigationSections } from "../../constants/dashboardNavigation";
import { openModuleRoute } from "../../utils/navigation/moduleNavigation";
import {
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import {
  capitalizeWords,
  filterAndSortProperties,
  formatRole,
  getInitials,
  getPropertyImages,
  isAuthUser,
  type AssetSortBy,
  type AssetSortOrder,
  type AssetStatusFilter,
} from "../../utils/dashboard/dashboardHelpers";

export default function DashboardScreen() {
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { height } = Dimensions.get("window");
  const heroHeight = Math.min(Math.max(height * 0.24, 192), 224);
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
  const notificationGlassStyle = {
    width: "100%" as const,
    height: "100%" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
    borderRadius: 999,
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(255,255,255,0.26)"
        : "rgba(255,255,255,0.08)",
  };
  const notificationIcon = (
    <>
      <Ionicons
        name="notifications-outline"
        size={23}
        color="#ffffff"
        style={{
          textShadowColor: "rgba(30,31,69,0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}
      />

      <View className="absolute right-3.5 top-3.5 h-2.5 w-2.5 rounded-full border border-white/95 bg-danger shadow-sm shadow-danger/20" />
    </>
  );
  const iosNotificationGlassContent = (
    <>
      <View className="absolute inset-0 rounded-full bg-white/10" />
      <View className="absolute inset-[1px] rounded-full border border-white/35" />
      <View className="absolute inset-0 rounded-full border border-white/55" />
      <View className="absolute -left-3 -top-3 h-10 w-14 rotate-[-25deg] rounded-full bg-white/70 opacity-75" />
      <View className="absolute left-1 top-1 h-9 w-9 rounded-full bg-white/20" />
      <View className="absolute -right-3 top-2 h-8 w-8 rounded-full bg-accent/25" />
      <View className="absolute -bottom-4 right-0 h-11 w-11 rounded-full bg-textPrimary/15 opacity-45" />
      {notificationIcon}
    </>
  );
  const androidNotificationGlassContent = (
    <>
      <View className="absolute inset-0 rounded-full bg-white/5" />
      {notificationIcon}
    </>
  );

  async function refreshDashboard() {
    setIsRefreshing(true);
    try {
      await refetchProperties();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Screen
      bottomInset="tab-bar"
      className="flex-1 bg-surface"
      horizontalInset="none"
      topInset="safe-area"
    >
      <ImageBackground
        source={require("../../assets/images/dashboard.webp")}
        resizeMode="cover"
        className="-mx-6 -mt-6 overflow-hidden px-6 pt-6"
        style={{ height: heroHeight }}
      >
        <View className="absolute inset-0 bg-textPrimary/60" />

        <View className="flex-row items-center justify-between pt-4">
          <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-white/30">
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-ralewayBold text-base text-white">
                  {getInitials(displayName, displayEmail)}
                </Text>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text
                className="font-ralewayBold text-base text-white"
                numberOfLines={1}
              >
                {capitalizeWords(displayName)}
              </Text>

              <Text className="text-sm text-white/80" numberOfLines={1}>
                {userSubtitle}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Open global search"
              hitSlop={10}
              className="h-[45px] w-[45px] items-center justify-center rounded-full border border-white/45 bg-white/10"
              onPress={() => setIsSearchModalOpen(true)}
              style={{
                shadowColor: "rgba(30,31,69,0.45)",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.24,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              <Feather name="search" size={20} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              hitSlop={10}
              className="relative overflow-hidden rounded-full border border-white/45 bg-white/10"
              onPress={() => openModuleRoute(appRoutes.secondary.notifications)}
              style={{
                width: 45,
                height: 45,
                shadowColor: "rgba(30,31,69,0.45)",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.24,
                shadowRadius: 16,
                elevation: 7,
              }}
            >
              {Platform.OS === "ios" ? (
                <GlassView
                  glassEffectStyle="regular"
                  tintColor="rgba(255,255,255,0.35)"
                  isInteractive
                  style={notificationGlassStyle}
                >
                  {iosNotificationGlassContent}
                </GlassView>
              ) : (
                <BlurView
                  intensity={410}
                  tint="light"
                  style={notificationGlassStyle}
                >
                  {androidNotificationGlassContent}
                </BlurView>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

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
      <FlatList
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        className="-mx-6"
        contentInsetAdjustmentBehavior="never"
        data={isLoadingProperties ? [] : visibleAssets}
        keyExtractor={(property) => property.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListHeaderComponent={
          <>
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
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={refreshDashboard}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
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
      <GlobalSearchModal
        isVisible={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
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
