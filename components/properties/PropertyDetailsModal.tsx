import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import {
  Dimensions,
  Image,
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
import { usePropertyLifecycleController } from "../../hooks/properties/usePropertyLifecycleController";
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
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { SkeletonBlock } from "../ui/Skeleton";
import { PropertyFloorSummary } from "./PropertyFloorSummary";
import { PropertyManagerAssignments } from "./PropertyManagerAssignments";
import { PropertyLifecyclePanel } from "./PropertyLifecyclePanel";
import { useAccess } from "../../hooks/auth/useAccess";
import { getPropertyLifecycleLabel } from "../../utils/properties/propertyLifecycle";

export function PropertyDetailsModal({
  accessToken,
  mode = "sheet",
  onClose,
  onPropertyUpdated,
  property,
}: {
  accessToken?: string;
  mode?: "screen" | "sheet";
  onClose: () => void;
  onPropertyUpdated?: (property: Property) => void;
  property: Property | null;
}) {
  const { height, width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { can } = useAccess();
  const pendingDetailsRoute = useRef<{
    propertyId: string;
    propertyTitle: string;
  } | null>(null);
  const showFullDetails = mode === "screen";
  const lifecycle = usePropertyLifecycleController({
    accessToken,
    enabled: showFullDetails,
    onUpdated: onPropertyUpdated,
    property,
  });
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
  const floorPlanQueries = useFloorPlanQueries(
    property?.id ?? "",
    accessToken,
    showFullDetails,
  );
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

  function openFullDetails() {
    if (!property) return;

    pendingDetailsRoute.current = {
      propertyId: property.id,
      propertyTitle: property.title,
    };
    onClose();
  }

  function handleDismiss() {
    const routeParams = pendingDetailsRoute.current;
    if (!routeParams) return;

    pendingDetailsRoute.current = null;
    router.push({
      pathname: appRoutes.secondary.propertyDetails,
      params: routeParams,
    });
  }

  const content = (
    <>
      {property ? (
        <View
          className={`overflow-hidden bg-white ${showFullDetails ? "flex-1" : "rounded-t-[30px]"}`}
          style={showFullDetails ? undefined : { maxHeight: height * 0.76 }}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              className={`relative h-56 overflow-hidden ${showFullDetails ? "" : "mt-4"}`}
            >
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
                accessibilityLabel={
                  showFullDetails
                    ? "Back from property details"
                    : "Close property details"
                }
                accessibilityRole="button"
                activeOpacity={0.78}
                className={`absolute h-10 w-10 items-center justify-center rounded-full bg-textPrimary/45 ${showFullDetails ? "left-4" : "right-4"}`}
                onPress={onClose}
                style={{ top: showFullDetails ? insets.top + 8 : 16 }}
              >
                <Feather
                  name={showFullDetails ? "arrow-left" : "x"}
                  color="#ffffff"
                  size={20}
                />
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
                <CountMetric
                  icon="grid"
                  label="Bedspaces"
                  loading={floorPlanQueries.rooms.isLoading}
                  value={property.bedspaceCount}
                />
              </View>

              {!showFullDetails ? (
                <TouchableOpacity
                  accessibilityHint="Opens the complete property profile on a new page"
                  accessibilityLabel="View more property details"
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  className="mt-4 flex-row items-center gap-3 rounded-2xl bg-primary px-4 py-4"
                  onPress={openFullDetails}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Feather name="maximize" color="#ffffff" size={17} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-ralewayExtraBold text-sm text-white">
                      View more details
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-white/75">
                      Open complete property profile
                    </Text>
                  </View>
                  <Feather name="chevron-right" color="#ffffff" size={19} />
                </TouchableOpacity>
              ) : null}

              {showFullDetails ? (
                <>
              <PropertyLifecyclePanel
                allowedTransitions={lifecycle.allowedTransitions}
                canUpdate={Boolean(
                  property && can("properties.update", property.id),
                )}
                currentStatus={property.status}
                error={lifecycle.error}
                history={lifecycle.history}
                historyError={lifecycle.historyError}
                isHistoryLoading={lifecycle.isHistoryLoading}
                isPending={lifecycle.isPending}
                onRequestTransition={lifecycle.requestTransition}
              />

              <TouchableOpacity
                accessibilityLabel="Manage property bedspaces"
                accessibilityRole="button"
                activeOpacity={0.8}
                className="mt-4 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4"
                onPress={() => {
                  router.push({
                    pathname: appRoutes.secondary.bedspaces,
                    params: {
                      propertyId: property.id,
                      propertyTitle: property.title,
                    },
                  });
                }}
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Feather name="grid" color="#8A77F4" size={17} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-ralewayBold text-sm text-textPrimary">
                    Bedspace inventory
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-description">
                    {property.bedspaceCount > 0
                      ? `${property.vacantBedspaceCount} vacant · ${property.occupiedBedspaceCount} occupied · ${property.maintenanceBedspaceCount} maintenance`
                      : (rooms.length || property.roomCount) > 0
                        ? `${rooms.length || property.roomCount} ${(rooms.length || property.roomCount) === 1 ? "room" : "rooms"} ready for bedspace setup`
                        : "Add a room before creating bedspaces"}
                  </Text>
                </View>
                <Feather name="chevron-right" color="#8A77F4" size={18} />
              </TouchableOpacity>

              <PropertyFloorSummary
                floorPlans={floorPlans}
                isLoading={
                  floorPlanQueries.floorPlans.isLoading ||
                  floorPlanQueries.rooms.isLoading
                }
                onManage={() => {
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

              {property.isPublished ? (
                <View className="mt-4 rounded-2xl border border-success/30 bg-success/10 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Feather name="globe" size={16} color="#027A48" />
                      <Text className="font-ralewayBold text-xs text-success">
                        Published on Terrane Marketplace
                      </Text>
                    </View>
                    <View className="rounded-full bg-success px-2 py-0.5">
                      <Text className="font-ralewayBold text-[9px] uppercase text-white">
                        Public
                      </Text>
                    </View>
                  </View>
                  {property.listingMode ? (
                    <Text className="mt-2 font-ralewayBold text-xs text-textPrimary">
                      {property.listingMode === "sale"
                        ? "For sale"
                        : property.listingMode === "stay"
                          ? "Available for short stays"
                          : "For rent"}
                      {property.listingType ? ` | ${property.listingType}` : ""}
                    </Text>
                  ) : null}
                  {property.value > 0 ? (
                    <Text className="mt-1 font-ralewayMedium text-xs text-description">
                      Listed value: ₱{property.value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <DetailsSection title="Current Tenants">
                {isLoading ? (
                  <View className="rounded-2xl border border-primary/20 bg-white p-3">
                    <View className="flex-row items-center justify-between gap-3">
                      <SkeletonBlock className="h-4 w-1/2" />
                      <SkeletonBlock className="h-5 w-16 rounded-full bg-primary/10" />
                    </View>
                    <SkeletonBlock className="mt-2 h-3 w-3/4" />
                  </View>
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
                              {lease.bedspace?.bedspaceNumber
                                ? `Bedspace ${lease.bedspace.bedspaceNumber} | `
                                : ""}
                              {lease.startDate} to {lease.endDate}
                            </Text>
                          </View>
                          <Text className="rounded-full bg-accent px-2 py-0.5 font-ralewayBold text-[9px] uppercase text-textPrimary">
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
                  <View className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-white p-3">
                    <SkeletonBlock className="h-10 w-10 rounded-xl bg-primary/10" />
                    <View className="min-w-0 flex-1 gap-2">
                      <SkeletonBlock className="h-4 w-2/3" />
                      <SkeletonBlock className="h-3 w-1/2" />
                    </View>
                    <SkeletonBlock className="h-5 w-5 rounded-lg" />
                  </View>
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
                </>
              ) : null}
            </View>
            {showFullDetails && can("staff.manage") && <PropertyManagerAssignments key={property.id} propertyId={property.id} />}
          </ScrollView>
        </View>
      ) : null}
      <ConfirmationModal
        confirmLabel="Change state"
        description={
          property && lifecycle.requestedStatus
            ? `Move ${property.title} from ${getPropertyLifecycleLabel(property.status)} to ${getPropertyLifecycleLabel(lifecycle.requestedStatus)}?`
            : "Confirm this lifecycle change."
        }
        isPending={lifecycle.isPending}
        onCancel={lifecycle.cancelTransition}
        onConfirm={() => void lifecycle.confirmTransition()}
        title="Change lifecycle state"
        visible={Boolean(property && lifecycle.requestedStatus)}
      />
    </>
  );

  if (mode === "screen") return content;

  return (
    <BottomSheetModal
      backdropAccessibilityLabel="Close property details"
      onClose={onClose}
      onDismiss={handleDismiss}
      statusBarTranslucent
      visible={Boolean(property)}
    >
      {content}
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
      {loading ? (
        <SkeletonBlock className="mt-3 h-7 w-12 bg-primary/15" />
      ) : (
        <Text className="mt-2 font-ralewayExtraBold text-2xl text-textPrimary">
          {value}
        </Text>
      )}
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
