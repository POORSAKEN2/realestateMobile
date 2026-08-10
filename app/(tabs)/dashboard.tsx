import {
  FlatList,
  Image,
  ImageBackground,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { type ReactNode, useMemo, useState } from "react";
import { Screen } from "../../components/ui/Screen";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useProperties } from "../../hooks/api/useProperties";
import { usePortfolioAnalytics } from "../../hooks/api/usePortfolioAnalytics";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";
import { router } from "expo-router";
import { appRoutes } from "../../constants/navigation";
import { colors } from "../../constants/colors";
import PropertyImageGallery from "../../components/properties/PropertyImageGallery";
import { PropertyDetailsModal } from "../../components/properties/PropertyDetailsModal";
import {
  ASSET_STATUS_FILTERS,
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

type AnalyticsMetric = {
  icon: ReactNode;
  label: string;
  value: string;
};

function AnalyticsMetricCard({
  height,
  icon,
  isLoading,
  label,
  value,
}: {
  height: number;
  icon: ReactNode;
  isLoading: boolean;
  label: string;
  value: string;
}) {
  return (
    <View
      className="justify-between rounded-[24px] border border-secondary/20 bg-white p-3 shadow-sm shadow-secondary/10"
      style={{ height }}
    >
      <View className="h-9 w-9 items-center justify-center rounded-2xl bg-secondary/10">
        {icon}
      </View>

      <View>
        <Text
          adjustsFontSizeToFit
          className="font-ralewayBold text-[17px] tracking-tight text-textPrimary"
          numberOfLines={1}
        >
          {isLoading ? "..." : value}
        </Text>
        <Text
          className="mt-1 font-ralewaySemiBold text-[10px] uppercase leading-4 text-description"
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function formatCompactPesoValue(value = 0) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1_000 || absoluteValue >= 1_000_000) {
    return formatPesoValue(value);
  }

  const prefix = value < 0 ? "-₱" : "₱";
  const compactValue = (absoluteValue / 1_000).toFixed(1).replace(/\.0$/, "");

  return `${prefix}${compactValue}K`;
}

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
  const [imageGalleryProperty, setImageGalleryProperty] =
    useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const { stats, isLoading: isLoadingAnalytics } =
    usePortfolioAnalytics(accessToken);
  const { useList } = useProperties();
  const { data: properties = [], isLoading: isLoadingProperties } = useList();
  const { height } = Dimensions.get("window");
  const floatingCardHeight = Math.min(Math.max(height * 0.36, 320), 360);
  const floatingCardPadding = 16;
  const analyticsHeaderHeight = 52;
  const metricGridGap = 12;
  const metricTileHeight = Math.max(
    (floatingCardHeight -
      floatingCardPadding * 2 -
      analyticsHeaderHeight -
      metricGridGap) /
      2,
    112,
  );
  const netIncome = stats?.net_operating_income ?? 0;
  const arrears = stats?.total_arrears ?? 0;
  const analyticsMetrics: AnalyticsMetric[] = [
    {
      icon: <Feather name="briefcase" size={17} color={colors.secondary} />,
      label: "Portfolio Value",
      value: formatPesoValue(stats?.total_value),
    },
    {
      icon: <Feather name="home" size={17} color={colors.secondary} />,
      label: "Occupancy",
      value: `${Number(stats?.occupancy_rate ?? 0).toFixed(0)}%`,
    },
    {
      icon: <Feather name="trending-up" size={17} color={colors.secondary} />,
      label: "Net Income",
      value: formatCompactPesoValue(netIncome),
    },
    {
      icon: <Feather name="clock" size={17} color={colors.secondary} />,
      label: "Arrears",
      value: formatCompactPesoValue(arrears),
    },
  ];
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

  return (
    <Screen className="flex-1 bg-surface">
      <ImageBackground
        source={require("../../assets/images/dashboard.webp")}
        resizeMode="cover"
        className="-mx-6 -mt-6 overflow-hidden px-6 pt-6"
        style={{
          height: height * 0.3,
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
      <View
        className="w-full rounded-[32px] border border-secondary/20 bg-white"
        style={{
          height: floatingCardHeight,
          padding: floatingCardPadding,
          marginTop: -176,
          zIndex: 10,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View
          className="flex-row items-center justify-between"
          style={{ height: analyticsHeaderHeight }}
        >
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5 pr-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary/10">
              <Feather name="bar-chart-2" size={17} color={colors.secondary} />
            </View>
            <Text
              className="min-w-0 flex-1 font-ralewayBold text-[14px] tracking-tight text-textPrimary"
              numberOfLines={1}
            >
              Analytics Overview
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="View portfolio analytics"
            accessibilityRole="button"
            activeOpacity={0.75}
            className="h-9 flex-row items-center gap-0.5 px-1"
            onPress={() => router.navigate(appRoutes.secondary.analytics)}
          >
            <Text className="font-ralewayBold text-[10px] text-secondary">
              View analytics
            </Text>
            <Feather name="chevron-right" size={15} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <View
          className="flex-row flex-wrap"
          style={{ margin: -(metricGridGap / 2) }}
        >
          {analyticsMetrics.map((item) => (
            <View
              key={item.label}
              className="w-1/2" // Forces 2 items per row
              style={{ padding: metricGridGap / 2 }}
            >
              <AnalyticsMetricCard
                height={metricTileHeight}
                icon={item.icon}
                isLoading={isLoadingAnalytics}
                label={item.label}
                value={item.value}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="flex flex-row items-center justify-between">
        <View className="my-5">
          <Text className="font-ralewayBold">Portfolio Assets</Text>
          <Text className="font-ralewayMedium text-description">
            High-value holdings
          </Text>
        </View>

        <View>
          <TouchableOpacity
            className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary"
            onPress={() => router.navigate(appRoutes.secondary.map)}
          >
            <Feather name="map" color={colors.whitePrimary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-[22px] border border-secondary/20 bg-white px-3 py-3 shadow-xl shadow-secondary/10">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10">
            <Feather name="search" size={20} color={colors.secondary} />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="mb-0.5 font-ralewayBold text-[11px] uppercase text-secondary">
              Find property
            </Text>
            <TextInput
              accessibilityLabel="Search portfolio assets"
              className="h-7 p-0 font-ralewaySemiBold text-sm text-textPrimary"
              placeholder="Location, unit, tenant, or asset"
              placeholderTextColor={colors.description}
              returnKeyType="search"
              value={assetSearchQuery}
              onChangeText={setAssetSearchQuery}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={
              showAssetFilters ? "Close search filters" : "Open search filters"
            }
            onPress={() =>
              setShowAssetFilters((current) => {
                if (current) {
                  setAssetStatusFilter("ALL");
                }

                return !current;
              })
            }
            className="h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10"
          >
            <Feather name="sliders" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {showAssetFilters && (
          <View className="mt-4 gap-3 border-t border-secondary/20 pt-3">
            <View>
              <Text className="mb-2 font-ralewayBold text-[10px] uppercase text-description">
                Sort by
              </Text>
              <View className="flex-row gap-2">
                {(["value", "roi", "name"] as AssetSortBy[]).map((sortKey) => {
                  const isActive = assetSortBy === sortKey;
                  const label =
                    sortKey === "value"
                      ? "Value"
                      : sortKey === "roi"
                        ? "ROI"
                        : "Name";

                  return (
                    <TouchableOpacity
                      key={sortKey}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Sort assets by ${label}`}
                      onPress={() => {
                        if (assetSortBy === sortKey) {
                          setAssetSortOrder((current) =>
                            current === "desc" ? "asc" : "desc",
                          );
                        } else {
                          setAssetSortBy(sortKey);
                          setAssetSortOrder(
                            sortKey === "name" ? "asc" : "desc",
                          );
                        }
                      }}
                      className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 ${
                        isActive ? "bg-secondary" : "bg-surface"
                      }`}
                    >
                      <Text
                        className={`font-ralewayBold text-[11px] ${
                          isActive ? "text-white" : "text-description"
                        }`}
                      >
                        {label}
                      </Text>
                      {isActive && (
                        <Feather
                          name={
                            assetSortOrder === "desc"
                              ? "arrow-down"
                              : "arrow-up"
                          }
                          size={11}
                          color={colors.whitePrimary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="mb-2 font-ralewayBold text-[10px] uppercase text-description">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ASSET_STATUS_FILTERS.map((status) => {
                  const isActive = assetStatusFilter === status;
                  const label =
                    status === "ALL" ? "All" : formatPropertyStatus(status);

                  return (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Show ${label} assets`}
                      onPress={() => setAssetStatusFilter(status)}
                      className={`rounded-full px-3 py-1.5 ${
                        isActive ? "bg-secondary" : "bg-surface"
                      }`}
                    >
                      <Text
                        className={`font-ralewayBold text-[10px] ${
                          isActive ? "text-white" : "text-description"
                        }`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>

      <View className="mt-4 flex-1">
        {isLoadingProperties ? (
          <View className="gap-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <View
                key={index}
                className="h-24 rounded-2xl border border-secondary/20 bg-secondary/10"
              />
            ))}
          </View>
        ) : visibleAssets.length > 0 ? (
          <FlatList
            data={visibleAssets}
            keyExtractor={(property) => property.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140 }}
            ItemSeparatorComponent={() => <View className="h-3" />}
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
        ) : (
          <View className="items-center justify-center rounded-2xl border border-dashed border-secondary/30 bg-secondary/10 px-4 py-6">
            <Feather name="search" size={22} color={colors.secondary} />
            <Text className="mt-2 font-ralewaySemiBold text-xs text-description">
              No assets found
            </Text>
          </View>
        )}
      </View>

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
