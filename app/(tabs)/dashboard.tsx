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
import { useMemo, useState } from "react";
import { Screen } from "../../components/ui/Screen";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProperties } from "../../hooks/api/useProperties";
import { usePortfolioAnalytics } from "../../hooks/api/usePortfolioAnalytics";
import { useAuth } from "../../hooks/useAuth";
import type { Property } from "../../types";
import { router } from "expo-router";
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
  const floatingCardHeight = Math.min(Math.max(height * 0.28, 230), 340);
  const floatingCardPadding = 14;
  const analyticsHeaderHeight = 44;
  const metricGridGap = 8;
  const metricTileHeight = Math.max(
    (floatingCardHeight -
      floatingCardPadding * 2 -
      analyticsHeaderHeight -
      metricGridGap) /
      2,
    72,
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
          textShadowColor: "rgba(15,23,42,0.35)",
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
      <View className="absolute -right-3 top-2 h-8 w-8 rounded-full bg-teal-100/25" />
      <View className="absolute -bottom-4 right-0 h-11 w-11 rounded-full bg-black/15 opacity-45" />
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
    <Screen className="flex-1 bg-white">
      <ImageBackground
        source={require("../../assets/images/dashboard.webp")}
        resizeMode="cover"
        className="-mx-6 -mt-6 overflow-hidden px-6 pt-6"
        style={{
          height: height * 0.3,
          width: "auto",
        }}
      >
        <View className="absolute inset-0 bg-black/25" />

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
                <Text className="font-soraSemiBold text-base text-white">
                  {getInitials(displayName, displayEmail)}
                </Text>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text
                className="text-base font-semibold text-white"
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
            onPress={() => router.push("/(tabs)/notificationScreen")}
            style={{
              width: 45,
              height: 45,
              shadowColor: "rgba(15,23,42,0.45)",
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
        className="w-full rounded-[32px] border border-white/80 bg-white"
        style={{
          height: floatingCardHeight,
          padding: floatingCardPadding,
          marginTop: -176,
          zIndex: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {/* --- HEADER --- */}
        <View
          className="flex-row items-center justify-between"
          style={{ height: analyticsHeaderHeight }}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            <Text className="font-soraSemiBold text-[13px] tracking-tight text-slate-900">
              Analytics Overview
            </Text>
          </View>
          <TouchableOpacity className="h-8 w-8 items-center justify-center rounded-full bg-slate-50">
            <Feather name="more-horizontal" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* --- THE 2x2 GRID --- */}
        {/* We use negative margin to counteract the padding on the children */}
        <View
          className="flex-row flex-wrap"
          style={{ margin: -(metricGridGap / 2) }}
        >
          {[
            {
              label: "Value",
              val: formatPesoValue(stats?.total_value),
              icon: "wallet",
              color: "teal",
              iconFamily: "Ionicons",
            },
            {
              label: "Yield",
              val: `${Number(stats?.avg_yield ?? 0).toFixed(1)}%`,
              icon: "trending-up",
              color: "teal",
              bgcolor: "",
              iconFamily: "Feather",
            },
            {
              label: "Arrears",
              val: formatPesoValue(stats?.total_arrears),
              icon: "alert-circle-outline",
              color: "teal",

              iconFamily: "MaterialCommunityIcons",
            },
            {
              label: "Income",
              val: formatPesoValue(stats?.net_operating_income),
              icon: "chart-line",
              color: "teal",

              iconFamily: "MaterialCommunityIcons",
            },
          ].map((item, idx) => (
            <View
              key={idx}
              className="w-1/2" // Forces 2 items per row
              style={{ padding: metricGridGap / 2 }}
            >
              <View
                className={`rounded-[22px] border border-${item.color}-50 bg-${item.color}-50/30 justify-center px-3`}
                style={{ height: metricTileHeight }}
              >
                <View
                  className={`mb-1 h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm`}
                >
                  {item.iconFamily === "Ionicons" && (
                    <Ionicons name="wallet" size={14} color="#475569" />
                  )}
                  {item.iconFamily === "Feather" && (
                    <Feather name="trending-up" size={14} color="#2563EB" />
                  )}
                  {item.iconFamily === "MaterialCommunityIcons" && (
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={14}
                      color={item.color === "rose" ? "#E11D48" : "#059669"}
                    />
                  )}
                </View>

                <Text
                  className="font-soraSemiBold text-base tracking-tighter text-slate-900"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isLoadingAnalytics ? "..." : item.val}
                </Text>
                <Text
                  className={`text-[9px] font-bold uppercase tracking-wider text-${item.color}-500/60`}
                >
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="flex flex-row items-center justify-between">
        <View className="my-5">
          <Text className="font-soraSemiBold">Portfolio Assets</Text>
          <Text className="font-regular text-description">
            High-value holdings
          </Text>
        </View>

        <View>
          <TouchableOpacity
            className="bg-teal-50"
            onPress={() => router.navigate("/(tabs)/mapCanvas")}
          >
            <Feather name="map" color="teal-500" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-[22px] border border-[#2563EB]/10 bg-white px-3 py-3 shadow-xl shadow-slate-900/10">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl ">
            <Feather name="search" size={20} color="#2563EB" />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="mb-0.5 font-soraSemiBold text-[11px] uppercase text-primary">
              Find property
            </Text>
            <TextInput
              accessibilityLabel="Search portfolio assets"
              className="h-7 p-0 font-soraMedium text-sm text-zinc-950"
              placeholder="Location, unit, tenant, or asset"
              placeholderTextColor="#94a3b8"
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
            className={`h-11 w-11 items-center justify-center rounded-2xl ${
              showAssetFilters ? "bg-teal-50" : "bg-[#2563EB]"
            }`}
          >
            <Feather
              name="sliders"
              size={18}
              color={showAssetFilters ? "#2563EB" : "#ffffff"}
            />
          </TouchableOpacity>
        </View>

        {showAssetFilters && (
          <View className="mt-4 gap-3 border-t border-teal-50 pt-3">
            <View>
              <Text className="mb-2 font-soraSemiBold text-[10px] uppercase text-zinc-400">
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
                        isActive ? "bg-[#2563EB]" : "bg-zinc-50"
                      }`}
                    >
                      <Text
                        className={`font-soraSemiBold text-[11px] ${
                          isActive ? "text-white" : "text-zinc-500"
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
                          color="#ffffff"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="mb-2 font-soraSemiBold text-[10px] uppercase text-zinc-400">
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
                        isActive ? "bg-[#2563EB]" : "bg-zinc-50"
                      }`}
                    >
                      <Text
                        className={`font-soraSemiBold text-[10px] ${
                          isActive ? "text-white" : "text-zinc-500"
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
                className="h-24 rounded-2xl border border-zinc-100 bg-zinc-50"
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
                className="flex-row gap-3 rounded-2xl border border-zinc-100 bg-white p-2.5"
              >
                <TouchableOpacity
                  activeOpacity={0.86}
                  accessibilityRole="button"
                  accessibilityLabel={`View images for ${property.title}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100"
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
                      <Text className="font-soraSemiBold text-[9px] text-white">
                        {getPropertyImages(property).length}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>

                <View className="min-w-0 flex-1 justify-between py-0.5">
                  <View>
                    <View className="flex-row items-start justify-between gap-2">
                      <Text
                        className="min-w-0 flex-1 font-soraSemiBold text-sm text-zinc-950"
                        numberOfLines={1}
                      >
                        {property.title}
                      </Text>
                      <Text className="rounded-full bg-teal-50 px-2 py-0.5 font-soraSemiBold text-[9px] uppercase text-teal-700">
                        {property.roi}% ROI
                      </Text>
                    </View>

                    <View className="mt-1 flex-row items-center gap-1">
                      <Feather name="map-pin" size={11} color="#71717a" />
                      <Text
                        className="min-w-0 flex-1 text-[11px] text-zinc-500"
                        numberOfLines={1}
                      >
                        {property.location}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text className="font-soraMedium text-[11px] text-zinc-500">
                      {formatPropertyStatus(property.status)}
                    </Text>
                    <Text className="font-soraSemiBold text-xs text-zinc-950">
                      {formatPesoValue(property.value)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View className="items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6">
            <Feather name="search" size={22} color="#a1a1aa" />
            <Text className="mt-2 font-soraMedium text-xs text-zinc-500">
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
