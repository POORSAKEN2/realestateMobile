import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appRoutes } from "../../constants/navigation";

import { fetchDocuments, fetchLeases } from "../../api/propertyDetails";
import { useFloorPlanQueries } from "../../hooks/api/useFloorPlans";
import { useClients } from "../../hooks/api/useClients";
import type { Property } from "../../types";
import {
  formatPesoValue,
  formatPropertyStatus,
  getLeaseRoomNumber,
  openPropertyDocument,
} from "../../utils/dashboard/dashboardHelpers";
import { getPropertyImages } from "../../utils/properties/propertyPresentation";
import { resolveFloorManagerPolicy } from "../../utils/properties/floorManagerPolicy";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { PropertyFloorSummary } from "./PropertyFloorSummary";

export function PropertyDetailsModal({
  accessToken,
  onClose,
  property,
}: {
  accessToken?: string;
  onClose: () => void;
  property: Property | null;
}) {
  const { height, width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const swipeDownResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          sheetTranslateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 72 || gesture.vy > 0.9) {
            Animated.timing(sheetTranslateY, {
              duration: 180,
              toValue: height,
              useNativeDriver: true,
            }).start(() => {
              onClose();
              sheetTranslateY.setValue(0);
            });
            return;
          }

          Animated.spring(sheetTranslateY, {
            bounciness: 4,
            speed: 20,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            bounciness: 4,
            speed: 20,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [height, onClose, sheetTranslateY],
  );
  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(property),
  });
  const { data: lessees = [], isLoading: isLoadingLessees } = useClients(
    accessToken,
    Boolean(property),
  );
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", accessToken, property?.id],
    queryFn: () => fetchDocuments(accessToken, { propertyId: property?.id }),
    enabled: Boolean(property),
  });
  const floorPlanQueries = useFloorPlanQueries(property?.id ?? "", accessToken);
  const floorPlans = floorPlanQueries.floorPlans.data ?? [];
  const rooms = floorPlanQueries.rooms.data ?? [];
  const floorManagerPolicy = resolveFloorManagerPolicy({
    backendCapabilities: property?.spatialCapabilities,
    hasFloorPlans: floorPlans.length > 0,
    hasRooms: rooms.length > 0,
    propertyType: property?.type,
  });

  const propertyLeases = useMemo(
    () =>
      property
        ? leases.filter((lease) => lease.propertyId === property.id)
        : [],
    [leases, property],
  );
  const propertyDocuments = useMemo(
    () =>
      property
        ? documents.filter(
            (document) =>
              !document.propertyId || document.propertyId === property.id,
          )
        : [],
    [documents, property],
  );
  const tenantCount = useMemo(
    () =>
      new Set(
        propertyLeases
          .map((lease) => lease.lesseeId || lease.lessee?.id)
          .filter(Boolean),
      ).size,
    [propertyLeases],
  );
  const isLoading = isLoadingLeases || isLoadingLessees || isLoadingDocuments;
  const images = property ? getPropertyImages(property) : [];

  return (
    <BottomSheetModal
      backdropAccessibilityLabel="Close property details"
      backdropClassName="bg-textPrimary/45"
      onClose={onClose}
      statusBarTranslucent
      visible={Boolean(property)}
    >
      {property ? (
        <Animated.View
          className="overflow-hidden rounded-t-[30px] bg-white"
          style={{
            maxHeight: height * 0.86,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            accessible
            accessibilityLabel="Swipe down to close property details"
            className="h-10 items-center justify-center"
            {...swipeDownResponder.panHandlers}
          >
            <View className="h-1.5 w-12 rounded-full bg-primary/30" />
          </View>
          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="relative mt-4 h-56 overflow-hidden">
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {images.map((image, index) => (
                  <Image
                    className="h-full bg-white"
                    key={`${image}:${index}`}
                    resizeMode="cover"
                    source={{ uri: image }}
                    style={{ width }}
                  />
                ))}
              </ScrollView>
              <View className="absolute inset-0 bg-textPrimary/35" />
              <TouchableOpacity
                accessibilityLabel="Close property details"
                accessibilityRole="button"
                activeOpacity={0.78}
                className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-textPrimary/45"
                onPress={onClose}
              >
                <Feather name="x" color="#ffffff" size={20} />
              </TouchableOpacity>
              <View className="absolute bottom-5 left-5 right-5">
                {images.length > 1 ? (
                  <View className="mb-3 flex-row gap-1.5">
                    {images.map((image, index) => (
                      <View
                        className="h-1.5 w-1.5 rounded-full bg-white/85"
                        key={`${image}:dot:${index}`}
                      />
                    ))}
                  </View>
                ) : null}
                <Text className="self-start rounded-md bg-primary px-2 py-1 font-ralewayBold text-[10px] uppercase text-white">
                  {formatPropertyStatus(property.status)}
                </Text>
                <Text
                  className="mt-2 font-ralewayBold text-2xl text-white"
                  numberOfLines={2}
                >
                  {property.title}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Feather name="map-pin" color="#ffffff" size={13} />
                  <Text
                    className="min-w-0 flex-1 text-xs text-white/80"
                    numberOfLines={1}
                  >
                    {property.location}
                    {property.country ? `, ${property.country}` : ""}
                  </Text>
                </View>
              </View>
            </View>

            <View className="px-5 pt-5">
              <View className="flex-row flex-wrap">
                <DetailMetric
                  label="Market Value"
                  value={formatPesoValue(property.value)}
                />
                <DetailMetric
                  accent
                  label="Annual ROI"
                  value={`${property.roi}%`}
                />
                <DetailMetric
                  label={
                    property.occupancy !== undefined
                      ? "Occupancy"
                      : property.bedrooms
                        ? "Configuration"
                        : "Asset Type"
                  }
                  value={
                    property.occupancy !== undefined
                      ? `${property.occupancy}%`
                      : property.bedrooms
                        ? `${property.bedrooms} BR / ${property.bathrooms ?? 0} BA`
                        : (property.type ?? "N/A")
                  }
                />
                <DetailMetric
                  label="Status"
                  value={formatPropertyStatus(property.status)}
                />
              </View>

              <View className="mt-4 flex-row gap-3">
                <CountMetric
                  icon="users"
                  label="Tenants"
                  loading={isLoading}
                  value={tenantCount}
                />
                <CountMetric
                  icon="file-text"
                  label="Documents"
                  loading={isLoading}
                  value={propertyDocuments.length}
                />
              </View>

              <PropertyFloorSummary
                floorPlans={floorPlans}
                isLoading={
                  floorPlanQueries.floorPlans.isLoading ||
                  floorPlanQueries.rooms.isLoading
                }
                onManage={() => {
                  onClose();
                  router.push({
                    pathname: appRoutes.secondary.floorPlans,
                    params: {
                      propertyId: property.id,
                      propertyTitle: property.title,
                      propertyType: property.type,
                    },
                  });
                }}
                policy={floorManagerPolicy}
                rooms={rooms}
              />

              <DetailsSection title="Current Tenants">
                {isLoading ? (
                  <View className="h-16 rounded-2xl bg-white" />
                ) : propertyLeases.length ? (
                  propertyLeases.map((lease) => {
                    const lessee =
                      lease.lessee ??
                      lessees.find((item) => item.id === lease.lesseeId);
                    return (
                      <View
                        className="rounded-2xl border border-primary/20 p-3"
                        key={lease.id}
                      >
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="min-w-0 flex-1">
                            <Text
                              className="font-ralewayBold text-sm text-textPrimary"
                              numberOfLines={1}
                            >
                              {lessee?.name ?? "Linked tenant"}
                            </Text>
                            <Text
                              className="mt-0.5 text-[11px] text-description"
                              numberOfLines={1}
                            >
                              {getLeaseRoomNumber(lease.roomNumber)} |{" "}
                              {lease.startDate} to {lease.endDate}
                            </Text>
                          </View>
                          <Text className="rounded-full bg-primary/10 px-2 py-0.5 font-ralewayBold text-[9px] uppercase text-secondary">
                            {lease.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <EmptyDetail text="No tenants linked to this property." />
                )}
              </DetailsSection>

              <DetailsSection title="Property Documents">
                {isLoading ? (
                  <View className="h-16 rounded-2xl bg-white" />
                ) : propertyDocuments.length ? (
                  propertyDocuments.map((document) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3"
                      key={document.id}
                      onPress={() => openPropertyDocument(document)}
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Feather name="file-text" color="#8A77F4" size={17} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text
                          className="font-ralewayBold text-sm text-textPrimary"
                          numberOfLines={1}
                        >
                          {document.name}
                        </Text>
                        <Text
                          className="mt-0.5 text-[11px] text-description"
                          numberOfLines={1}
                        >
                          {document.category} | {document.size}
                        </Text>
                      </View>
                      <Feather
                        name="external-link"
                        color={document.url ? "#8A77F4" : "#BEE3DB"}
                        size={15}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <EmptyDetail text="No documents attached to this property." />
                )}
              </DetailsSection>

              <View className="mt-6 flex-row gap-3 border-t border-primary/20 pt-5">
                <Attribute
                  icon="maximize-2"
                  label="Total Area"
                  value={property.area || "N/A"}
                />
                <Attribute
                  icon="zap"
                  label="Utility Score"
                  value={property.utilityScore || "A+"}
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      ) : null}
    </BottomSheetModal>
  );
}

function DetailMetric({
  accent = false,
  label,
  value,
}: {
  accent?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View className="w-1/2 p-1.5">
      <View
        className={`rounded-2xl border border-primary/20 p-3 ${accent ? "bg-accent/50" : "bg-white"}`}
      >
        <Text
          className={`font-ralewayBold text-[10px] uppercase ${accent ? "text-textPrimary/70" : "text-description"}`}
        >
          {label}
        </Text>
        <Text
          adjustsFontSizeToFit
          className="mt-1 font-ralewayExtraBold text-lg text-textPrimary"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function CountMetric({
  icon,
  label,
  loading,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  loading: boolean;
  value: number;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-primary/20 bg-white p-4">
      <View className="flex-row items-center gap-2">
        <Feather name={icon} color="#8A77F4" size={16} />
        <Text className="font-ralewayBold text-[10px] uppercase text-secondary">
          {label}
        </Text>
      </View>
      <Text className="mt-2 font-ralewayExtraBold text-2xl text-textPrimary">
        {loading ? "..." : value}
      </Text>
    </View>
  );
}

function DetailsSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View className="mt-6 border-t border-primary/20 pt-5">
      <Text className="font-ralewayBold text-xs uppercase text-description">
        {title}
      </Text>
      <View className="mt-3 gap-2">{children}</View>
    </View>
  );
}

function EmptyDetail({ text }: { text: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-primary/20 bg-white px-4 py-5">
      <Text className="font-ralewaySemiBold text-xs text-description">
        {text}
      </Text>
    </View>
  );
}

function Attribute({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Feather name={icon} color="#8A77F4" size={15} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayBold text-[9px] uppercase text-description">
          {label}
        </Text>
        <Text
          className="font-ralewayBold text-xs text-textPrimary"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
