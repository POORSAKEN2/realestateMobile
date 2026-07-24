import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchDocuments,
  fetchLeases,
  fetchLessees,
} from "../../api/propertyDetails";
import type { Property } from "../../types";
import {
  formatPesoValue,
  formatPropertyStatus,
  getLeaseRoomNumber,
  openPropertyDocument,
} from "../../utils/dashboard/dashboardHelpers";
import { getPropertyImages } from "../../utils/properties/propertyPresentation";

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
  const { data: leases = [], isLoading: isLoadingLeases } = useQuery({
    queryKey: ["leases", accessToken],
    queryFn: () => fetchLeases(accessToken),
    enabled: Boolean(property),
  });
  const { data: lessees = [], isLoading: isLoadingLessees } = useQuery({
    queryKey: ["lessees", accessToken],
    queryFn: () => fetchLessees(accessToken),
    enabled: Boolean(property),
  });
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ["documents", accessToken, property?.id],
    queryFn: () => fetchDocuments(accessToken, { propertyId: property?.id }),
    enabled: Boolean(property),
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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(property)}
    >
      <View className="flex-1 justify-end bg-black/45">
        <Pressable
          accessibilityLabel="Close property details"
          accessibilityRole="button"
          className="flex-1"
          onPress={onClose}
        />

        {property ? (
          <View
            className="overflow-hidden rounded-t-[30px] bg-white"
            style={{ maxHeight: height * 0.86 }}
          >
            <View className="mt-3 h-1.5 w-12 self-center rounded-full bg-zinc-200" />
            <ScrollView
              bounces={false}
              contentContainerStyle={{ paddingBottom: 28 }}
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
                      className="h-full bg-zinc-100"
                      key={`${image}:${index}`}
                      resizeMode="cover"
                      source={{ uri: image }}
                      style={{ width }}
                    />
                  ))}
                </ScrollView>
                <View className="absolute inset-0 bg-black/35" />
                <TouchableOpacity
                  accessibilityLabel="Close property details"
                  accessibilityRole="button"
                  activeOpacity={0.78}
                  className="absolute right-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/35"
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
                  <Text className="self-start rounded-md bg-teal-600 px-2 py-1 font-ralewayBold text-[10px] uppercase text-white">
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

                <DetailsSection title="Current Tenants">
                  {isLoading ? (
                    <View className="h-16 rounded-2xl bg-zinc-50" />
                  ) : propertyLeases.length ? (
                    propertyLeases.map((lease) => {
                      const lessee =
                        lease.lessee ??
                        lessees.find((item) => item.id === lease.lesseeId);
                      return (
                        <View
                          className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                          key={lease.id}
                        >
                          <View className="flex-row items-start justify-between gap-2">
                            <View className="min-w-0 flex-1">
                              <Text
                                className="font-ralewayBold text-sm text-zinc-950"
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
                            <Text className="rounded-full bg-white px-2 py-0.5 font-ralewayBold text-[9px] uppercase text-zinc-500">
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
                    <View className="h-16 rounded-2xl bg-zinc-50" />
                  ) : propertyDocuments.length ? (
                    propertyDocuments.map((document) => (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="flex-row items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                        key={document.id}
                        onPress={() => openPropertyDocument(document)}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
                          <Feather name="file-text" color="#0f766e" size={17} />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            className="font-ralewayBold text-sm text-zinc-950"
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
                          color={document.url ? "#71717a" : "#d4d4d8"}
                          size={15}
                        />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <EmptyDetail text="No documents attached to this property." />
                  )}
                </DetailsSection>

                <View className="mt-6 flex-row gap-3 border-t border-zinc-100 pt-5">
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
          </View>
        ) : null}
      </View>
    </Modal>
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
        className={`rounded-2xl border p-3 ${accent ? "border-emerald-100 bg-emerald-50" : "border-zinc-100 bg-zinc-50"}`}
      >
        <Text
          className={`font-ralewayBold text-[10px] uppercase ${accent ? "text-emerald-700/70" : "text-zinc-400"}`}
        >
          {label}
        </Text>
        <Text
          adjustsFontSizeToFit
          className={`mt-1 text-lg font-ralewayExtraBold ${accent ? "text-emerald-700" : "text-zinc-950"}`}
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
    <View className="flex-1 rounded-2xl border border-teal-100 bg-teal-50 p-4">
      <View className="flex-row items-center gap-2">
        <Feather name={icon} color="#0f766e" size={16} />
        <Text className="font-ralewayBold text-[10px] uppercase text-teal-700">
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-2xl font-ralewayExtraBold text-zinc-950">
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
    <View className="mt-6 border-t border-zinc-100 pt-5">
      <Text className="font-ralewayBold text-xs uppercase text-zinc-400">
        {title}
      </Text>
      <View className="mt-3 gap-2">{children}</View>
    </View>
  );
}

function EmptyDetail({ text }: { text: string }) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
      <Text className="font-ralewaySemiBold text-xs text-zinc-500">{text}</Text>
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
    <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-zinc-50 p-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
        <Feather name={icon} color="#52525b" size={15} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayBold text-[9px] uppercase text-zinc-400">
          {label}
        </Text>
        <Text
          className="font-ralewayBold text-xs text-zinc-950"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
