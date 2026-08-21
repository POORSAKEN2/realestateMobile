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
import { router } from "expo-router";
import { appRoutes } from "../../constants/navigation";
import { colors } from "../../constants/colors";
import PropertyImageGallery from "../../components/properties/PropertyImageGallery";
import { PortfolioAssetFilterSheet } from "../../components/properties/PortfolioAssetFilterSheet";
import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import { PropertyPortfolioSummary } from "../../components/properties/PropertyPortfolioSummary";
import {
  SkeletonGroup,
  SkeletonList,
  SkeletonListCard,
} from "../../components/ui/Skeleton";
import {
  capitalizeWords,
  filterAndSortProperties,
  formatPesoValue,
  formatPropertyStatus,
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

      <View className="absolute right-3.5 top-3.5 h-2.5 w-2.5 rounded-full border border-white/95 bg-red-500 shadow-sm shadow-red-900/40" />
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
    <Screen bottomInset="tab-bar" className="flex-1 bg-surface">
      <ImageBackground
        source={require("../../assets/images/dashboard.webp")}
        resizeMode="cover"
        className="-mx-6 -mt-6 overflow-hidden px-6 pt-6"
        style={{
          height: heroHeight,
          width: "auto",
        }}
      >
        <View className="absolute inset-0 bg-textPrimary/25" />

        <View className="flex-row items-center justify-between pt-4">
          {/* Profile */}
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

              {/* {displayEmail && (
                <Text className="text-xs text-white/70" numberOfLines={1}>
                  {displayEmail}
                </Text>
              )} */}
            </View>
          </View>

          {/* Notification */}
          <TouchableOpacity
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            hitSlop={10}
            className="relative overflow-hidden rounded-full border border-white/45 bg-white/10"
            onPress={() => router.push(appRoutes.secondary.notifications)}
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

      <View className="mb-4 mt-5">
        <Text className="font-ralewayBold">Portfolio Assets</Text>

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
            variant="compact"
          />

          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityLabel="Open property map"
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary"
            onPress={() => router.navigate(appRoutes.secondary.map)}
          >
            <Feather name="map" color={colors.whitePrimary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-4 flex-1">
        {isLoadingProperties ? (
          <SkeletonGroup
            accessibilityLabel="Loading portfolio assets"
            className="gap-3"
          >
            <SkeletonList
              count={2}
              renderItem={() => <SkeletonListCard className="min-h-24" />}
            />
          </SkeletonGroup>
        ) : (
          <FlatList
            data={visibleAssets}
            keyExtractor={(property) => property.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={
              <View className="items-center justify-center rounded-2xl border border-dashed border-secondary/30 bg-secondary/10 px-4 py-6">
                <Feather name="search" size={22} color={colors.secondary} />
                <Text className="mt-2 font-ralewaySemiBold text-xs text-description">
                  No assets found
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                colors={[colors.secondary]}
                onRefresh={refreshDashboard}
                refreshing={isRefreshing}
                tintColor={colors.secondary}
              />
            }
            renderItem={({ item: property }) => (
              <TouchableOpacity
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`View ${property.title}`}
                onPress={() => setSelectedProperty(property)}
                className="flex-row gap-3 rounded-2xl border border-textPrimary/10 bg-white p-2.5"
              >
                <TouchableOpacity
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel={`View images for ${property.title}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl bg-secondary/10"
                  onPress={(event) => {
                    event.stopPropagation();
                    setImageGalleryProperty(property);
                  }}
                >
                  <Image
                    source={{ uri: getPropertyImages(property)[0] }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                  {getPropertyImages(property).length > 1 ? (
                    <View className="absolute bottom-1.5 right-1.5 rounded-full bg-black/55 px-1.5 py-0.5">
                      <Text className="font-ralewayBold text-[9px] text-white">
                        {getPropertyImages(property).length}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

                <View className="min-w-0 flex-1 justify-between py-0.5">
                  <View>
                    <View className="flex-row items-start justify-between gap-2">
                      <Text
                        className="min-w-0 flex-1 font-ralewayBold text-sm text-textPrimary"
                        numberOfLines={1}
                      >
                        {property.title}
                      </Text>
                      <Text className="rounded-full bg-accent px-2 py-0.5 font-ralewayBold text-[9px] uppercase text-textPrimary">
                        {property.roi}% ROI
                      </Text>
                    </View>

                    <View className="mt-1 flex-row items-center gap-1">
                      <Feather
                        name="map-pin"
                        size={11}
                        color={colors.description}
                      />
                      <Text
                        className="min-w-0 flex-1 text-[11px] text-description"
                        numberOfLines={1}
                      >
                        {property.location}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="font-ralewaySemiBold text-[11px] text-description">
                      {formatPropertyStatus(property.status)}
                    </Text>
                    <Text className="font-ralewayBold text-xs text-textPrimary">
                      {formatPesoValue(property.value)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

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
