import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Screen } from "../../components/ui/Screen";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  fetchPortfolioHistory,
  fetchPortfolioStats,
} from "../../api/analytics";
import { fetchProperties } from "../../api/properties";
import {
  fetchDocuments,
  fetchLeases,
  fetchLessees,
} from "../../api/propertyDetails";
import { useAuth } from "../../hooks/useAuth";
import type { AuthUser, Property, PropertyDocument } from "../../types";
import { router } from "expo-router";

type AssetSortBy = "value" | "roi" | "name";
type AssetSortOrder = "asc" | "desc";
type AssetStatusFilter = "ALL" | Property["status"];
const assetStatusFilters: AssetStatusFilter[] = [
  "ALL",
  "REVENUE_GENERATING",
  "PRE_LEASED",
  "UNDER_CONSTRUCTION",
  "PERSONAL_USE",
  "IDLE",
];
const MAX_PROPERTY_IMAGES = 5;

const calculateTrend = (current: number, previous?: number) => {
  if (previous === undefined || previous === 0) return null;

  const diff = ((current - previous) / previous) * 100;

  return {
    direction: diff >= 0 ? ("up" as const) : ("down" as const),
    value: `${Math.abs(diff).toFixed(1)}%`,
  };
};

const formatPesoValue = (value: number = 0) => {
  if (value >= 1_000_000_000) return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value === 0) return "₱0";

  return `₱${value.toLocaleString()}`;
};

const formatPropertyStatus = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function getPropertyImages(property: Property) {
  const images = property.images?.length ? property.images : [property.image];
  return Array.from(new Set(images.filter(Boolean))).slice(0, MAX_PROPERTY_IMAGES);
}

function PropertyImageGallery({
  images,
  title,
  visible,
  onClose,
}: {
  images: string[];
  title: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [galleryWidth, setGalleryWidth] = useState(0);

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 bg-black/95">
        <View className="absolute left-5 right-5 top-14 z-10 flex-row items-center justify-between gap-4">
          <Text
            className="min-w-0 flex-1 font-soraSemiBold text-base text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Close image gallery"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
            onPress={onClose}
          >
            <Feather name="x" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View
          className="flex-1 justify-center"
          onLayout={(event) => setGalleryWidth(event.nativeEvent.layout.width)}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {images.map((image, index) => (
              <View
                className="justify-center"
                key={`${image}:gallery:${index}`}
                style={{ width: galleryWidth || 1 }}
              >
                <Image
                  className="h-[72%] w-full"
                  resizeMode="contain"
                  source={{ uri: image }}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {images.length > 1 ? (
          <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-2">
            {images.map((image, index) => (
              <View
                className="h-2 w-2 rounded-full bg-white/80"
                key={`${image}:gallery-dot:${index}`}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

async function openDocument(document: PropertyDocument) {
  if (!document.url) {
    Alert.alert(
      "Document unavailable",
      "This document does not have a viewable file URL.",
    );
    return;
  }

  try {
    const canOpen = await Linking.canOpenURL(document.url);

    if (!canOpen) {
      Alert.alert(
        "Cannot open document",
        "No app is available to open this document.",
      );
      return;
    }

    await Linking.openURL(document.url);
  } catch {
    Alert.alert("Cannot open document", "The document could not be opened.");
  }
}

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === "object" && value !== null;

const getInitials = (name?: string, email?: string) => {
  const source = name?.trim() || email?.trim() || "User";
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
};

const formatRole = (role?: string) => {
  if (!role) return "Property Manager";

  return role
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getLeaseRoomNumber = (roomNumber?: string | null) =>
  roomNumber?.trim() || "No room assigned";

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
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["analytics", "stats", accessToken],
    queryFn: () => fetchPortfolioStats(accessToken),
  });
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["analytics", "history", accessToken],
    queryFn: () => fetchPortfolioHistory(accessToken),
  });
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ["properties", accessToken],
    queryFn: () => fetchProperties(accessToken),
  });
  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: !!selectedProperty,
  });
  const { data: lessees = [], isLoading: isLoadingLessees } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: !!selectedProperty,
  });
  const { data: propertyDocuments = [], isLoading: isLoadingDocuments } =
    useQuery({
      queryKey: ["documents", accessToken, selectedProperty?.id],
      queryFn: () =>
        fetchDocuments(accessToken, { propertyId: selectedProperty?.id }),
      enabled: !!selectedProperty,
    });

  const { height, width } = Dimensions.get("window");
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
  const isLoadingAnalytics = isLoadingStats || isLoadingHistory;
  const previousSnapshot = history[1];

  const trends = useMemo(
    () => ({
      totalValue: calculateTrend(
        stats?.total_value ?? 0,
        previousSnapshot?.total_value,
      ),
      yield: calculateTrend(stats?.avg_yield ?? 0, previousSnapshot?.avg_yield),
      arrears: calculateTrend(
        stats?.total_arrears ?? 0,
        previousSnapshot?.total_arrears,
      ),
      noi: calculateTrend(
        stats?.net_operating_income ?? 0,
        previousSnapshot?.net_operating_income,
      ),
    }),
    [previousSnapshot, stats],
  );
  const visibleAssets = useMemo(() => {
    const query = assetSearchQuery.toLowerCase().trim();

    return [...properties]
      .filter((property) => {
        const matchesStatus =
          assetStatusFilter === "ALL" || property.status === assetStatusFilter;
        const matchesSearch =
          !query ||
          property.title.toLowerCase().includes(query) ||
          property.location.toLowerCase().includes(query);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (assetSortBy === "name") {
          return assetSortOrder === "asc"
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }

        const valueA = assetSortBy === "value" ? a.value : a.roi;
        const valueB = assetSortBy === "value" ? b.value : b.roi;

        return assetSortOrder === "asc" ? valueA - valueB : valueB - valueA;
      });
  }, [
    assetSearchQuery,
    assetSortBy,
    assetSortOrder,
    assetStatusFilter,
    properties,
  ]);
  const selectedPropertyLeases = useMemo(() => {
    if (!selectedProperty) return [];

    return leases.filter((lease) => lease.propertyId === selectedProperty.id);
  }, [leases, selectedProperty]);
  const selectedPropertyDocuments = useMemo(() => {
    if (!selectedProperty) return [];

    return propertyDocuments.filter(
      (document) =>
        !document.propertyId || document.propertyId === selectedProperty.id,
    );
  }, [propertyDocuments, selectedProperty]);
  const selectedPropertyTenantCount = useMemo(
    () =>
      new Set(
        selectedPropertyLeases
          .map((lease) => lease.lesseeId || lease.lessee?.id)
          .filter(Boolean),
      ).size,
    [selectedPropertyLeases],
  );
  const isLoadingPropertyDetails =
    isLoadingLeases || isLoadingLessees || isLoadingDocuments;

  const renderTrend = (
    trend: ReturnType<typeof calculateTrend>,
    tone: "positive" | "negative" = "positive",
  ) => {
    if (isLoadingAnalytics) {
      return (
        <Text className="mt-1 text-[10px] font-medium text-zinc-400">
          Loading
        </Text>
      );
    }

    if (!trend) {
      return (
        <Text className="mt-1 text-[10px] font-medium text-zinc-400">
          No prior data
        </Text>
      );
    }

    const isUp = trend.direction === "up";
    const isFavorable =
      tone === "positive"
        ? trend.direction === "up"
        : trend.direction === "down";
    const colorClass = isFavorable ? "text-emerald-600" : "text-rose-600";

    return (
      <View className="mt-1 flex-row items-center gap-1">
        <Ionicons
          name={isUp ? "trending-up" : "trending-down"}
          size={12}
          color={isFavorable ? "#059669" : "#e11d48"}
        />
        <Text className={`font-soraSemiBold text-[10px] ${colorClass}`}>
          {trend.value}
        </Text>
      </View>
    );
  };

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
              bgcolor:"",
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
          <TouchableOpacity className="bg-teal-50"  onPress={() => router.navigate('/(tabs)/mapCanvas')} >
            <Feather name= "map" color="teal-500"/>
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
                {assetStatusFilters.map((status) => {
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

      
      <Modal
        visible={!!selectedProperty}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedProperty(null)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close property details"
            className="flex-1"
            onPress={() => setSelectedProperty(null)}
          />

          {selectedProperty && (
            <View
              className="overflow-hidden rounded-t-[30px] bg-white"
              style={{ maxHeight: height * 0.86 }}
            >
              <View className="mt-3 h-1.5 w-12 self-center rounded-full bg-zinc-200" />

              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 28 }}
              >
                <View className="relative mt-4 h-56 overflow-hidden">
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                  >
                    {getPropertyImages(selectedProperty).map((image, index) => (
                      <Image
                        source={{ uri: image }}
                        className="h-full bg-zinc-100"
                        key={`${image}:${index}`}
                        resizeMode="cover"
                        style={{ width }}
                      />
                    ))}
                  </ScrollView>
                  <View className="absolute inset-0 bg-black/35" />

                  <TouchableOpacity
                    activeOpacity={0.78}
                    accessibilityRole="button"
                    accessibilityLabel="Close property details"
                    onPress={() => setSelectedProperty(null)}
                    className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
                  >
                    <Feather name="x" size={20} color="#ffffff" />
                  </TouchableOpacity>

                  <View className="absolute bottom-5 left-5 right-5">
                    {getPropertyImages(selectedProperty).length > 1 ? (
                      <View className="mb-3 flex-row gap-1.5">
                        {getPropertyImages(selectedProperty).map(
                          (image, index) => (
                            <View
                              className="h-1.5 w-1.5 rounded-full bg-white/85"
                              key={`${image}:dot:${index}`}
                            />
                          ),
                        )}
                      </View>
                    ) : null}
                    <Text className="self-start rounded-md bg-teal-600 px-2 py-1 font-soraSemiBold text-[10px] uppercase text-white">
                      {formatPropertyStatus(selectedProperty.status)}
                    </Text>
                    <Text
                      className="mt-2 font-soraSemiBold text-2xl text-white"
                      numberOfLines={2}
                    >
                      {selectedProperty.title}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Feather name="map-pin" size={13} color="#ffffff" />
                      <Text
                        className="min-w-0 flex-1 text-xs text-white/80"
                        numberOfLines={1}
                      >
                        {selectedProperty.location}
                        {selectedProperty.country
                          ? `, ${selectedProperty.country}`
                          : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="px-5 pt-5">
                  <View className="flex-row flex-wrap">
                    <View className="w-1/2 p-1.5">
                      <View className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                        <Text className="font-soraSemiBold text-[10px] uppercase text-zinc-400">
                          Market Value
                        </Text>
                        <Text className="mt-1 text-xl font-bold text-zinc-950">
                          {formatPesoValue(selectedProperty.value)}
                        </Text>
                      </View>
                    </View>

                    <View className="w-1/2 p-1.5">
                      <View className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                        <Text className="font-soraSemiBold text-[10px] uppercase text-emerald-700/70">
                          Annual ROI
                        </Text>
                        <View className="mt-1 flex-row items-center gap-1">
                          <Text className="text-xl font-bold text-emerald-700">
                            {selectedProperty.roi}%
                          </Text>
                          <Feather
                            name="trending-up"
                            size={16}
                            color="#047857"
                          />
                        </View>
                      </View>
                    </View>

                    <View className="w-1/2 p-1.5">
                      <View className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                        <Text className="font-soraSemiBold text-[10px] uppercase text-zinc-400">
                          {selectedProperty.occupancy !== undefined
                            ? "Occupancy"
                            : selectedProperty.bedrooms
                              ? "Configuration"
                              : "Asset Type"}
                        </Text>
                        <Text className="mt-1 text-lg font-bold text-zinc-950">
                          {selectedProperty.occupancy !== undefined
                            ? `${selectedProperty.occupancy}%`
                            : selectedProperty.bedrooms
                              ? `${selectedProperty.bedrooms} BR / ${selectedProperty.bathrooms ?? 0} BA`
                              : (selectedProperty.type ?? "N/A")}
                        </Text>
                      </View>
                    </View>

                    <View className="w-1/2 p-1.5">
                      <View className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                        <Text className="font-soraSemiBold text-[10px] uppercase text-zinc-400">
                          Status
                        </Text>
                        <Text
                          className="mt-1 text-lg font-bold text-zinc-950"
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {formatPropertyStatus(selectedProperty.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mt-4 flex-row gap-3">
                    <View className="flex-1 rounded-2xl border border-teal-100 bg-teal-50 p-4">
                      <View className="flex-row items-center gap-2">
                        <Feather name="users" size={16} color="#0f766e" />
                        <Text className="font-soraSemiBold text-[10px] uppercase text-teal-700">
                          Tenants
                        </Text>
                      </View>
                      <Text className="mt-2 text-2xl font-bold text-zinc-950">
                        {isLoadingPropertyDetails
                          ? "..."
                          : selectedPropertyTenantCount}
                      </Text>
                    </View>

                    <View className="flex-1 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <View className="flex-row items-center gap-2">
                        <Feather name="file-text" size={16} color="#0369a1" />
                        <Text className="font-soraSemiBold text-[10px] uppercase text-sky-700">
                          Documents
                        </Text>
                      </View>
                      <Text className="mt-2 text-2xl font-bold text-zinc-950">
                        {isLoadingPropertyDetails
                          ? "..."
                          : selectedPropertyDocuments.length}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-6 border-t border-zinc-100 pt-5">
                    <Text className="font-soraSemiBold text-xs uppercase text-zinc-400">
                      Current Tenants
                    </Text>
                    <View className="mt-3 gap-2">
                      {isLoadingPropertyDetails ? (
                        <View className="h-16 rounded-2xl bg-zinc-50" />
                      ) : selectedPropertyLeases.length > 0 ? (
                        selectedPropertyLeases.map((lease) => {
                          const lessee =
                            lease.lessee ??
                            lessees.find((item) => item.id === lease.lesseeId);

                          return (
                            <View
                              key={lease.id}
                              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                            >
                              <View className="flex-row items-start justify-between gap-2">
                                <View className="min-w-0 flex-1">
                                  <Text
                                    className="font-soraSemiBold text-sm text-zinc-950"
                                    numberOfLines={1}
                                  >
                                    {lessee?.name ?? "Linked tenant"}
                                  </Text>
                                  <Text
                                    className="mt-0.5 text-[11px] text-zinc-500"
                                    numberOfLines={1}
                                  >
                                    {getLeaseRoomNumber(lease.roomNumber)} |{" "}
                                    {lease.startDate} to {lease.endDate}
                                  </Text>
                                </View>
                                <Text className="rounded-full bg-white px-2 py-0.5 font-soraSemiBold text-[9px] uppercase text-zinc-500">
                                  {lease.status}
                                </Text>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <View className="items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
                          <Text className="font-soraMedium text-xs text-zinc-500">
                            No tenants linked to this property.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="mt-6 border-t border-zinc-100 pt-5">
                    <Text className="font-soraSemiBold text-xs uppercase text-zinc-400">
                      Property Documents
                    </Text>
                    <View className="mt-3 gap-2">
                      {isLoadingPropertyDetails ? (
                        <View className="h-16 rounded-2xl bg-zinc-50" />
                      ) : selectedPropertyDocuments.length > 0 ? (
                        selectedPropertyDocuments.map((document) => (
                          <TouchableOpacity
                            key={document.id}
                            activeOpacity={0.8}
                            className="flex-row items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                            onPress={() => openDocument(document)}
                          >
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                              <Feather
                                name="file-text"
                                size={17}
                                color="#0f766e"
                              />
                            </View>
                            <View className="min-w-0 flex-1">
                              <Text
                                className="font-soraSemiBold text-sm text-zinc-950"
                                numberOfLines={1}
                              >
                                {document.name}
                              </Text>
                              <Text
                                className="mt-0.5 text-[11px] text-zinc-500"
                                numberOfLines={1}
                              >
                                {document.category} | {document.size}
                              </Text>
                            </View>
                            <Feather
                              name="external-link"
                              size={15}
                              color={document.url ? "#71717a" : "#d4d4d8"}
                            />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View className="items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
                          <Text className="font-soraMedium text-xs text-zinc-500">
                            No documents attached to this property.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="mt-6 flex-row gap-3 border-t border-zinc-100 pt-5">
                    <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-zinc-50 p-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                        <Feather name="maximize-2" size={15} color="#52525b" />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-soraSemiBold text-[9px] uppercase text-zinc-400">
                          Total Area
                        </Text>
                        <Text
                          className="font-soraSemiBold text-xs text-zinc-950"
                          numberOfLines={1}
                        >
                          {selectedProperty.area || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-zinc-50 p-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                        <Feather name="zap" size={15} color="#52525b" />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="font-soraSemiBold text-[9px] uppercase text-zinc-400">
                          Utility Score
                        </Text>
                        <Text className="font-soraSemiBold text-xs text-zinc-950">
                          {selectedProperty.utilityScore || "A+"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

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
