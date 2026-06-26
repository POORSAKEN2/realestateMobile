import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";
import MapView, {
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";

import { useProperties, propertyFetchers } from "../../hooks/api/useProperties";
import {
  fetchDocuments,
  uploadPropertyDocuments,
} from "../../api/propertyDetails";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type {
  CreatePropertyPayload,
  DocumentUpload,
  Property,
  PropertyDocument,
  UpdatePropertyPayload,
} from "../../types";

type PropertyType = NonNullable<Property["type"]>;
type StatusFilter = Property["status"] | "ALL";

type FormState = {
  title: string;
  location: string;
  country: string;
  status: Property["status"];
  type: PropertyType;
  value: string;
  roi: string;
  occupancy: string;
  bedrooms: string;
  bathrooms: string;
  lat: string;
  lng: string;
  area: string;
  description: string;
  isTransientBookable: boolean;
};

type Choice<T extends string> = {
  label: string;
  value: T;
};

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

type SelectedDocument = DocumentUpload;

type PropertyListItem =
  | { kind: "search" }
  | { kind: "property"; property: Property }
  | { kind: "empty" };

type PropertyFormPayload = CreatePropertyPayload | UpdatePropertyPayload;

const propertyStatusChoices: Choice<Property["status"]>[] = [
  { label: "Idle", value: "IDLE" },
  { label: "Under Construction", value: "UNDER_CONSTRUCTION" },
  { label: "Pre Leased", value: "PRE_LEASED" },
  { label: "Revenue Generating", value: "REVENUE_GENERATING" },
  { label: "Personal Use", value: "PERSONAL_USE" },
];

const propertyTypeChoices: Choice<PropertyType>[] = [
  { label: "Residential", value: "Residential" },
  { label: "Condominium", value: "Condominium" },
  { label: "Commercial", value: "Commercial" },
  { label: "Industrial", value: "Industrial" },
  { label: "Retail", value: "Retail" },
];

const seaCountryChoices: Choice<string>[] = [
  { label: "Brunei", value: "Brunei" },
  { label: "Cambodia", value: "Cambodia" },
  { label: "Indonesia", value: "Indonesia" },
  { label: "Laos", value: "Laos" },
  { label: "Malaysia", value: "Malaysia" },
  { label: "Myanmar", value: "Myanmar" },
  { label: "Philippines", value: "Philippines" },
  { label: "Singapore", value: "Singapore" },
  { label: "Thailand", value: "Thailand" },
  { label: "Timor-Leste", value: "Timor-Leste" },
  { label: "Vietnam", value: "Vietnam" },
];

const statusFilterChoices: Choice<StatusFilter>[] = [
  { label: "All", value: "ALL" },
  ...propertyStatusChoices.map((choice) => ({
    label: formatStatus(choice.value),
    value: choice.value,
  })),
];

const suggestedLocations = [
  "Makati City, Metro Manila",
  "Taguig City, Metro Manila (BGC)",
  "Quezon City, Metro Manila",
  "Cebu City, Cebu",
  "Davao City, Davao del Sur",
  "Pasig City, Metro Manila",
  "Mandaluyong City, Metro Manila",
  "Paranaque City, Metro Manila",
  "Alabang, Muntinlupa City",
  "Baguio City, Benguet",
  "Angeles City, Pampanga",
  "Iloilo City, Iloilo",
  "Bacoor City, Cavite",
  "Santa Rosa, Laguna",
];

const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Makati City, Metro Manila": { lat: 14.5547, lng: 121.0244 },
  "Taguig City, Metro Manila (BGC)": { lat: 14.5505, lng: 121.0488 },
  "Quezon City, Metro Manila": { lat: 14.676, lng: 121.0437 },
  "Cebu City, Cebu": { lat: 10.3157, lng: 123.8854 },
  "Davao City, Davao del Sur": { lat: 7.1907, lng: 125.4553 },
  "Pasig City, Metro Manila": { lat: 14.5764, lng: 121.0851 },
  "Mandaluyong City, Metro Manila": { lat: 14.5794, lng: 121.0359 },
  "Paranaque City, Metro Manila": { lat: 14.4793, lng: 121.0198 },
  "Alabang, Muntinlupa City": { lat: 14.423, lng: 121.0386 },
  "Baguio City, Benguet": { lat: 16.4023, lng: 120.596 },
  "Angeles City, Pampanga": { lat: 15.145, lng: 120.5887 },
  "Iloilo City, Iloilo": { lat: 10.7202, lng: 122.5621 },
  "Bacoor City, Cavite": { lat: 14.459, lng: 120.929 },
  "Santa Rosa, Laguna": { lat: 14.2843, lng: 121.0889 },
};

const PHILIPPINES_REGION: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

const PINNED_LOCATION_DELTA = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};
const MAX_PROPERTY_IMAGES = 5;

const emptyForm: FormState = {
  title: "",
  location: "",
  country: "Philippines",
  status: "IDLE",
  type: "Residential",
  value: "",
  roi: "",
  occupancy: "",
  bedrooms: "2",
  bathrooms: "1",
  lat: "",
  lng: "",
  area: "",
  description: "",
  isTransientBookable: false,
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPeso(value = 0) {
  if (value >= 1_000_000_000)
    return `PHP ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  return `PHP ${value.toLocaleString()}`;
}

function isResidential(type: PropertyType) {
  return type === "Residential" || type === "Condominium";
}

function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseInteger(value: string) {
  const parsed = parseNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

function cleanDecimal(value: string, allowNegative = false) {
  let cleaned = value.replace(/[^\d.,-]/g, "");

  cleaned = allowNegative
    ? cleaned.replace(/(?!^)-/g, "")
    : cleaned.replace(/-/g, "");

  const [firstPart, ...otherParts] = cleaned.split(".");
  return [firstPart, otherParts.join("")].filter(Boolean).join(".");
}

function cleanInteger(value: string) {
  return value.replace(/\D/g, "");
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function toFormState(property: Property): FormState {
  const propertyType = property.type ?? "Residential";

  return {
    title: property.title,
    location: property.location,
    country: property.country ?? "Philippines",
    status: property.status,
    type: propertyType,
    value: String(property.value || ""),
    roi: String(property.roi || ""),
    occupancy:
      property.occupancy !== undefined && property.occupancy !== null
        ? String(property.occupancy)
        : "",
    bedrooms:
      property.bedrooms !== undefined && property.bedrooms !== null
        ? String(property.bedrooms)
        : isResidential(propertyType)
          ? "2"
          : "",
    bathrooms:
      property.bathrooms !== undefined && property.bathrooms !== null
        ? String(property.bathrooms)
        : isResidential(propertyType)
          ? "1"
          : "",
    lat:
      property.lat !== undefined && property.lat !== null
        ? String(property.lat)
        : "",
    lng:
      property.lng !== undefined && property.lng !== null
        ? String(property.lng)
        : "",
    area: property.area ?? "",
    description: "",
    isTransientBookable: Boolean(property.isTransientBookable),
  };
}

function getImageName(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) return asset.fileName;

  const [nameFromUri] = asset.uri.split("/").slice(-1);
  return nameFromUri || `property-${Date.now()}.jpg`;
}

function getImageType(asset: ImagePicker.ImagePickerAsset) {
  if (asset.mimeType) return asset.mimeType;
  if (asset.uri.toLowerCase().endsWith(".png")) return "image/png";
  if (asset.uri.toLowerCase().endsWith(".webp")) return "image/webp";

  return "image/jpeg";
}

function toSelectedImage(asset: ImagePicker.ImagePickerAsset): SelectedImage {
  return {
    uri: asset.uri,
    name: getImageName(asset),
    type: getImageType(asset),
    file: asset.file,
  };
}

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
            className="min-w-0 flex-1 text-base font-bold text-white"
            numberOfLines={1}
          >
            {title}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#FFFFFF" size={22} />
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

function getDocumentType(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.mimeType) return asset.mimeType;

  const extension = asset.name.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";

  return "application/octet-stream";
}

function formatSelectedDocumentSize(size?: number | null) {
  if (!size) return "N/A";
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;

  return `${size} B`;
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
}) {
  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <TextInput
        className={`rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 text-base text-[#1d1d1f] shadow-sm ${
          multiline ? "min-h-28 py-4" : "h-14"
        }`}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6F6D6D"
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
    </View>
  );
}

function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  onSelect,
  horizontal = false,
}: {
  label?: string;
  choices: Choice<T>[];
  value: T;
  onSelect: (value: T) => void;
  horizontal?: boolean;
}) {
  const content = (
    <View className="flex-row flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = choice.value === value;

        return (
          <TouchableOpacity
            key={choice.value}
            activeOpacity={0.8}
            className={`rounded-full border px-3.5 py-2.5 ${
              selected
                ? "border-[#2563EB] bg-[#2563EB]"
                : "border-[#1d1d1f]/10 bg-[#2563EB]/5"
            }`}
            onPress={() => onSelect(choice.value)}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? "text-[#FFFFFF]" : "text-[#1d1d1f]"
              }`}
            >
              {choice.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View className={label ? "gap-3" : ""}>
      {label ? (
        <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
          {label}
        </Text>
      ) : null}
      {horizontal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="pr-6">{content}</View>
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

function CountryDropdown({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry =
    seaCountryChoices.find((choice) => choice.value === value)?.label || value;

  function selectCountry(country: string) {
    onSelect(country);
    setIsOpen(false);
  }

  return (
    <View className="gap-2">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        Country
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        className="h-14 flex-row items-center justify-between rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF] px-4 shadow-sm"
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-base font-semibold text-[#1d1d1f]">
          {selectedCountry || "Select a country"}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          color="#6F6D6D"
          size={22}
        />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View className="flex-1 justify-end bg-[#000000]/35">
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1"
            onPress={() => setIsOpen(false)}
          />
          <View className="max-h-[72%] rounded-t-[28px] bg-[#FFFFFF] px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-bold text-[#1d1d1f]">
                  Select Country
                </Text>
                <Text className="mt-1 text-xs font-semibold text-[#6F6D6D]">
                  Southeast Asia
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/10"
                onPress={() => setIsOpen(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1d1d1f"
                  size={20}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2">
                {seaCountryChoices.map((country) => {
                  const selected = country.value === value;

                  return (
                    <TouchableOpacity
                      key={country.value}
                      activeOpacity={0.85}
                      className={`min-h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
                        selected
                          ? "border-[#2563EB] bg-[#2563EB]/10"
                          : "border-[#1d1d1f]/10 bg-[#FFFFFF]"
                      }`}
                      onPress={() => selectCountry(country.value)}
                    >
                      <Text
                        className={`text-base font-semibold ${
                          selected ? "text-[#2563EB]" : "text-[#1d1d1f]"
                        }`}
                      >
                        {country.label}
                      </Text>
                      {selected ? (
                        <MaterialCommunityIcons
                          name="check"
                          color="#2563EB"
                          size={21}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LocationPinPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (coordinates: { lat: string; lng: string }) => void;
}) {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const latitude = parseNumber(lat);
  const longitude = parseNumber(lng);
  const hasPinnedLocation =
    latitude !== undefined && longitude !== undefined;
  const markerCoordinate = hasPinnedLocation
    ? { latitude: latitude as number, longitude: longitude as number }
    : undefined;
  const mapRegion = markerCoordinate
    ? { ...markerCoordinate, ...PINNED_LOCATION_DELTA }
    : PHILIPPINES_REGION;

  function setPinnedLocation(latitudeValue: number, longitudeValue: number) {
    onChange({
      lat: formatCoordinate(latitudeValue),
      lng: formatCoordinate(longitudeValue),
    });
  }

  function handleMapPress(event: MapPressEvent) {
    const { latitude: nextLatitude, longitude: nextLongitude } =
      event.nativeEvent.coordinate;
    setPinnedLocation(nextLatitude, nextLongitude);
  }

  return (
    <View className="gap-3 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
            Pin Location
          </Text>
          <Text className="mt-1 text-sm font-bold text-[#1d1d1f]">
            {markerCoordinate
              ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(
                  markerCoordinate.longitude,
                )}`
              : "No pin selected"}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]"
          onPress={() => setIsMapVisible(true)}
        >
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            color="#FFFFFF"
            size={22}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#2563EB]/10"
        onPress={() => setIsMapVisible(true)}
      >
        <MaterialCommunityIcons name="map-search" color="#2563EB" size={19} />
        <Text className="text-sm font-bold text-[#2563EB]">
          {markerCoordinate ? "Update Pin on Map" : "Pin Property on Map"}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsMapVisible(false)}
        visible={isMapVisible}
      >
        <View className="flex-1 bg-[#FFFFFF]">
          <MapView
            initialRegion={mapRegion}
            onPress={handleMapPress}
            style={propertyMapStyles.locationMap}
          >
            {markerCoordinate ? (
              <Marker
                coordinate={markerCoordinate}
                draggable
                onDragEnd={(event) => {
                  const { latitude: nextLatitude, longitude: nextLongitude } =
                    event.nativeEvent.coordinate;
                  setPinnedLocation(nextLatitude, nextLongitude);
                }}
              />
            ) : null}
          </MapView>

          <View className="absolute left-5 right-5 top-14 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                  Property Pin
                </Text>
                <Text className="mt-1 text-sm font-bold text-[#1d1d1f]">
                  {markerCoordinate
                    ? `${formatCoordinate(markerCoordinate.latitude)}, ${formatCoordinate(
                        markerCoordinate.longitude,
                      )}`
                    : "Tap the map to place the pin"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#1d1d1f]/10"
                onPress={() => setIsMapVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1d1d1f"
                  size={20}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="absolute bottom-8 left-5 right-5">
            <TouchableOpacity
              activeOpacity={0.85}
              className="h-14 items-center justify-center rounded-2xl bg-[#2563EB]"
              onPress={() => setIsMapVisible(false)}
            >
              <Text className="text-base font-bold text-[#FFFFFF]">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]/10">
        <MaterialCommunityIcons name={icon} color="#2563EB" size={20} />
      </View>
      <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
        {label}
      </Text>
      <Text className="mt-1 text-lg font-bold text-[#1d1d1f]">{value}</Text>
    </View>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <View className="flex-1 justify-center rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF] p-6 shadow-sm">
      <View className="items-center">
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-3 text-sm font-semibold text-[#1d1d1f]">
          {label}
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#6F6D6D]">
          Preparing your real estate portfolio workspace.
        </Text>
      </View>
      <View className="mt-6 gap-3">
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
        <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" />
      </View>
    </View>
  );
}

function PropertyCard({
  property,
  onEdit,
  onOpenBookings,
}: {
  property: Property;
  onEdit: () => void;
  onOpenBookings?: () => void;
}) {
  const occupancy = property.occupancy ?? 0;
  const isActive = property.status === "REVENUE_GENERATING";
  const propertyImages = getPropertyImages(property);
  const [imageWidth, setImageWidth] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      className="w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
    >
      {/* --- IMAGE SECTION --- */}
      <TouchableOpacity
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`View images for ${property.title}`}
        className="relative h-52 w-full"
        onLayout={(event) => setImageWidth(event.nativeEvent.layout.width)}
        onPress={() => setIsGalleryVisible(true)}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {propertyImages.map((image, index) => (
            <Image
              className="h-full bg-slate-100"
              key={`${image}:${index}`}
              resizeMode="cover"
              source={{ uri: image }}
              style={{ width: imageWidth || 1 }}
            />
          ))}
        </ScrollView>

        {/* Top Badges: Type & ROI */}
        <View className="absolute inset-x-4 top-4 flex-row items-center justify-between">
          <View className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
              {property.type ?? "Property"}
            </Text>
          </View>

          <View className="rounded-full bg-[#2563EB] px-3 py-1.5 shadow-md">
            <Text className="text-[11px] font-bold text-white">
              {property.roi.toFixed(1)}% ROI
            </Text>
          </View>
        </View>

        {/* Bottom Gradient Overlay (Optional: adds depth for white text if needed) */}
        <View className="absolute bottom-0 h-16 w-full bg-gradient-to-t from-black/20 to-transparent" />

        {propertyImages.length > 1 ? (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
            {propertyImages.map((image, index) => (
              <View
                className="h-1.5 w-1.5 rounded-full bg-white/85"
                key={`${image}:dot:${index}`}
              />
            ))}
          </View>
        ) : null}
      </TouchableOpacity>

      <PropertyImageGallery
        images={propertyImages}
        onClose={() => setIsGalleryVisible(false)}
        title={property.title}
        visible={isGalleryVisible}
      />

      {/* --- CONTENT SECTION --- */}
      <View className="p-5">
        {/* Title and Status Row */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-soraSemiBold text-xl tracking-tight text-[#1d1d1f]">
              {property.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="map-marker"
                color="#94A3B8"
                size={14}
              />
              <Text
                className="text-sm font-medium text-slate-500"
                numberOfLines={1}
              >
                {property.location}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-lg px-2.5 py-1 ${
              isActive ? "bg-emerald-50" : "bg-amber-50"
            }`}
          >
            <Text
              className={`text-[10px] font-bold uppercase tracking-tighter ${
                isActive ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {formatStatus(property.status)}
            </Text>
          </View>
        </View>

        {/* --- METRICS GRID: Reuse our standardized logic --- */}
        <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Property Value
            </Text>
            <Text className="mt-1 font-soraSemiBold text-lg text-[#1d1d1f]">
              {formatPeso(property.value)}
            </Text>
          </View>

          <View className="mx-4 h-8 w-[1px] bg-slate-200" />

          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Occupancy
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                {occupancy}%
              </Text>
              {/* Visual Indicator */}
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <View
                  className="h-full bg-[#2563EB]"
                  style={{ width: `${occupancy}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* --- FOOTER: Features --- */}
        <View className="mt-5 flex-row items-center gap-4">
          {property.bedrooms !== undefined && (
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons
                name="bed-king-outline"
                color="#64748B"
                size={18}
              />
              <Text className="text-sm font-bold text-slate-600">
                {property.bedrooms}
              </Text>
            </View>
          )}

          {property.bathrooms !== undefined && (
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="shower" color="#64748B" size={18} />
              <Text className="text-sm font-bold text-slate-600">
                {property.bathrooms}
              </Text>
            </View>
          )}

          {/* Added a spacer to push things left, or add more features here */}
          <View className="flex-1" />
          {onOpenBookings ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/5"
              onPress={onOpenBookings}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                color="#2563EB"
                size={17}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            className="h-8 w-8 items-center justify-center rounded-full bg-[#2563EB]/5"
            onPress={onEdit}
          >
            <MaterialCommunityIcons name="pencil" color="#2563EB" size={17} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PropertiesScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    SelectedDocument[]
  >([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { useList, useCreate, useUpdate } = useProperties();
  const { data: properties = [], isLoading } = useList();
  const {
    data: existingPropertyDocuments = [],
    isLoading: isLoadingExistingDocuments,
  } = useQuery({
    queryKey: ["documents", accessToken, editingProperty?.id],
    queryFn: () =>
      fetchDocuments(accessToken, { propertyId: editingProperty?.id }),
    enabled: Boolean(accessToken && editingProperty?.id && isFormVisible),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: PropertyFormPayload) => {
      const property = editingProperty
        ? await propertyFetchers.update({ id: editingProperty.id, payload })
        : await propertyFetchers.create(payload);

      if (selectedDocuments.length > 0) {
        await uploadPropertyDocuments(
          property.id,
          selectedDocuments,
          accessToken,
        );
      }

      return property;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["properties"] });
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await queryClient.invalidateQueries({
        queryKey: ["transientBookablePropertyIds"],
      });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      closeForm();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Failed to save property.",
      );
    },
  });

  const filteredProperties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return properties.filter((property) => {
      const statusMatches =
        statusFilter === "ALL" || property.status === statusFilter;
      const searchMatches =
        !query ||
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query);

      return statusMatches && searchMatches;
    });
  }, [properties, searchQuery, statusFilter]);
  const propertyListItems = useMemo<PropertyListItem[]>(() => {
    const propertyItems = filteredProperties.map((property) => ({
      kind: "property" as const,
      property,
    }));

    return [
      { kind: "search" },
      ...(propertyItems.length > 0
        ? propertyItems
        : [{ kind: "empty" as const }]),
    ];
  }, [filteredProperties]);

  const filteredLocationSuggestions = useMemo(() => {
    const query = form.location.trim().toLowerCase();

    if (!query) return suggestedLocations.slice(0, 5);

    return suggestedLocations
      .filter((location) => location.toLowerCase().includes(query))
      .slice(0, 5);
  }, [form.location]);

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
  const revenueGeneratingPercentage =
    properties.length === 0
      ? 0
      : (revenueGeneratingCount / properties.length) * 100;

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForm() {
    setForm(emptyForm);
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(null);
    setIsFormVisible(true);
  }

  function openEditForm(property: Property) {
    setForm(toFormState(property));
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(property);
    setIsFormVisible(true);
  }

  function closeForm() {
    setForm(emptyForm);
    setSelectedImages([]);
    setSelectedDocuments([]);
    setFormError("");
    setEditingProperty(null);
    setIsFormVisible(false);
  }

  function selectLocation(location: string) {
    const coordinates = locationCoordinates[location];

    setForm((current) => ({
      ...current,
      location,
      country: "Philippines",
      lat: coordinates ? String(coordinates.lat) : current.lat,
      lng: coordinates ? String(coordinates.lng) : current.lng,
    }));
  }

  async function pickImage() {
    setFormError("");

    if (selectedImages.length >= MAX_PROPERTY_IMAGES) {
      setFormError(`You can upload up to ${MAX_PROPERTY_IMAGES} property images.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setFormError("Photo library permission is required to add an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      quality: 0.85,
      selectionLimit: MAX_PROPERTY_IMAGES - selectedImages.length,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const pickedImages = result.assets.map(toSelectedImage);

    setSelectedImages((current) => {
      const existingUris = new Set(current.map((image) => image.uri));
      const newImages = pickedImages.filter(
        (image) => !existingUris.has(image.uri),
      );
      const nextImages = [...current, ...newImages].slice(0, MAX_PROPERTY_IMAGES);

      if (current.length + newImages.length > MAX_PROPERTY_IMAGES) {
        setFormError(`Only ${MAX_PROPERTY_IMAGES} property images can be uploaded.`);
      }

      return nextImages;
    });
  }

  function removeImage(index: number) {
    setSelectedImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );
  }

  async function pickDocuments() {
    setFormError("");

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ],
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const pickedDocuments = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      type: getDocumentType(asset),
      size: asset.size,
      file: asset.file,
    }));

    setSelectedDocuments((current) => {
      const existingKeys = new Set(
        current.map((document) => `${document.name}:${document.size ?? ""}`),
      );
      const newDocuments = pickedDocuments.filter((document) => {
        const key = `${document.name}:${document.size ?? ""}`;
        return !existingKeys.has(key);
      });

      return [...current, ...newDocuments];
    });
  }

  function removeDocument(index: number) {
    setSelectedDocuments((current) =>
      current.filter((_, documentIndex) => documentIndex !== index),
    );
  }

  function handleSubmit() {
    setFormError("");

    if (saveMutation.isPending) return;

    if (!accessToken) {
      setFormError("Please log in before creating a property.");
      return;
    }

    const title = form.title.trim();
    const location = form.location.trim();
    const country = form.country.trim();
    const value = parseNumber(form.value);
    const roi = parseNumber(form.roi);
    const lat = parseNumber(form.lat);
    const lng = parseNumber(form.lng);
    const occupancy = parseNumber(form.occupancy);
    const bedrooms = parseInteger(form.bedrooms);
    const bathrooms = parseInteger(form.bathrooms);

    if (!title || !location || !country) {
      setFormError("Property title, location, and country are required.");
      return;
    }

    if (value === undefined || value < 0) {
      setFormError("Market value must be a valid number of 0 or greater.");
      return;
    }

    if (roi === undefined) {
      setFormError("Expected ROI must be a valid number.");
      return;
    }

    if (lat === undefined || lng === undefined) {
      setFormError(
        "Latitude and longitude are required. Select a suggested location or enter valid coordinates.",
      );
      return;
    }

    if (
      form.occupancy.trim() &&
      (occupancy === undefined || occupancy < 0 || occupancy > 100)
    ) {
      setFormError("Occupancy must be a valid percentage from 0 to 100.");
      return;
    }

    if (isResidential(form.type) && bedrooms === undefined) {
      setFormError("Bedrooms must be a non-negative whole number.");
      return;
    }

    if (isResidential(form.type) && bathrooms === undefined) {
      setFormError("Bathrooms must be a non-negative whole number.");
      return;
    }

    const payload: PropertyFormPayload = {
      title,
      location,
      country,
      status: form.status,
      type: form.type,
      value,
      roi,
      lat,
      lng,
      is_transient_bookable: form.isTransientBookable,
    };

    if (selectedImages.length > 0) payload.images = selectedImages;

    const area = form.area.trim();
    const description = form.description.trim();

    if (occupancy !== undefined) payload.occupancy = occupancy;
    if (area) payload.area = area;
    if (description) payload.description = description;

    if (isResidential(form.type)) {
      payload.bedrooms = bedrooms;
      payload.bathrooms = bathrooms;
    }

    saveMutation.mutate(payload);
  }

  return (
    <Screen className="bg-[#2563EB]/5">
      <View className="flex-1">
        {isLoading ? (
          <LoadingState label="Loading properties" />
        ) : (
          <FlatList
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
            data={propertyListItems}
            ItemSeparatorComponent={() => <View className="h-4" />}
            keyExtractor={(item) =>
              item.kind === "property" ? item.property.id : item.kind
            }
            ListHeaderComponent={
              <View className="gap-6 pb-6">
                {/* --- HEADER SECTION: Brand & Quick Action --- */}
                <View className="flex-row items-center justify-between px-1">
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
                      Asset Management
                    </Text>
                    <Text className="font-soraSemiBold text-3xl tracking-tight text-[#1d1d1f]">
                      Properties
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={openForm}
                    className="flex-row items-center gap-2 rounded-2xl bg-[#2563EB] px-4 py-3 shadow-md shadow-blue-200"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      color="#FFFFFF"
                      size={20}
                    />
                    <Text className="font-bold text-white">Add Asset</Text>
                  </TouchableOpacity>
                </View>

                {/* --- MAIN PORTFOLIO CARD: The "Hero" Data --- */}
                <View className="overflow-hidden rounded-[32px] bg-[#1d1d1f] p-6 shadow-xl shadow-slate-900/20">
                  {/* Background Decorative Element (Optional) */}
                  <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />

                  <View className="flex-row items-start justify-between">
                    <View>
                      <Text className="text-xs font-medium uppercase tracking-widest text-white/60">
                        Total Portfolio Value
                      </Text>
                      <Text className="mt-2 font-soraSemiBold text-4xl text-white">
                        {formatPeso(portfolioValue)}
                      </Text>
                    </View>
                    <View className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1">
                      <Text className="text-[10px] font-bold text-emerald-400">
                        +{averageRoi.toFixed(1)}% YIELD
                      </Text>
                    </View>
                  </View>

                  {/* Integrated Health Bar */}
                  <View className="mt-8">
                    <View className="mb-2 flex-row items-end justify-between">
                      <Text className="text-xs font-medium text-white/60">
                        Revenue Generating Assets
                      </Text>
                      <Text className="text-xs font-bold text-white">
                        {revenueGeneratingCount} / {properties.length}
                      </Text>
                    </View>
                    <View className="h-2 w-full flex-row gap-1">
                      <View
                        className="h-full rounded-l-full bg-[#2563EB]"
                        style={{ width: `${revenueGeneratingPercentage}%` }}
                      />
                      <View
                        className="h-full rounded-r-full bg-white/10"
                        style={{
                          width: `${100 - revenueGeneratingPercentage}%`,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* --- QUICK METRICS: Assets & Distribution --- */}
                <View className="flex-row gap-4">
                  <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      <MaterialCommunityIcons
                        name="domain"
                        color="#2563EB"
                        size={20}
                      />
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total Assets
                      </Text>
                      <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                        {properties.length}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      <MaterialCommunityIcons
                        name="chart-donut"
                        color="#2563EB"
                        size={20}
                      />
                    </View>
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Avg. ROI
                      </Text>
                      <Text className="font-soraSemiBold text-lg text-[#1d1d1f]">
                        {averageRoi.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              if (item.kind === "search") {
                return (
                  <View className=" bg-white pb-1">
                    <View className="gap-3 rounded-[28px] border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-3 shadow-sm">
                      <View className="h-14 flex-row items-center rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 px-4">
                        <MaterialCommunityIcons
                          name="magnify"
                          color="#2563EB"
                          size={21}
                        />
                        <TextInput
                          className="ml-2 flex-1 text-base text-[#1d1d1f]"
                          onChangeText={setSearchQuery}
                          placeholder="Search properties"
                          placeholderTextColor="#6F6D6D"
                          value={searchQuery}
                        />
                      </View>

                      <ChoiceGroup
                        choices={statusFilterChoices}
                        horizontal
                        onSelect={setStatusFilter}
                        value={statusFilter}
                      />
                    </View>
                  </View>
                );
              }

              if (item.kind === "empty") {
                return (
                  <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-[#FFFFFF]/95 p-8 shadow-sm">
                    <MaterialCommunityIcons
                      name="home-search-outline"
                      color="#2563EB"
                      size={38}
                    />
                    <Text className="mt-3 text-base font-bold text-[#1d1d1f]">
                      No properties found
                    </Text>
                    <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
                      Try another search or create a new property.
                    </Text>
                  </View>
                );
              }

              return (
                <PropertyCard
                  property={item.property}
                  onEdit={() => openEditForm(item.property)}
                  onOpenBookings={
                    item.property.isTransientBookable
                      ? () =>
                          router.push({
                            pathname: "/(tabs)/bookings",
                            params: { propertyId: item.property.id },
                          })
                      : undefined
                  }
                />
              );
            }}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={[1]}
          />
        )}
      </View>

      <Modal
        animationType="slide"
        onRequestClose={closeForm}
        presentationStyle="fullScreen"
        visible={isFormVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-[#2563EB]/5"
        >
          <View className="bg-[#1d1d1f] px-6 pb-5 pt-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-[#FFFFFF]">
                  {editingProperty ? "Edit Property" : "Add Property"}
                </Text>
                <Text className="mt-1 text-sm text-[#FFFFFF]/70">
                  {editingProperty
                    ? "Update this portfolio asset."
                    : "Create a portfolio asset."}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#FFFFFF]/15"
                onPress={closeForm}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#FFFFFF"
                  size={22}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-5 px-6 py-6"
            keyboardShouldPersistTaps="handled"
          >
            <Field
              label="Property Title"
              onChangeText={(value) => updateForm("title", value)}
              placeholder="e.g. The Shard"
              value={form.title}
            />

            <Field
              label="Location"
              onChangeText={(value) => updateForm("location", value)}
              placeholder="City, area, or address"
              value={form.location}
            />

            <View className="flex-row flex-wrap gap-2">
              {filteredLocationSuggestions.map((location) => (
                <TouchableOpacity
                  key={location}
                  activeOpacity={0.8}
                  className="rounded-full border border-[#1d1d1f]/10 bg-[#FFFFFF] px-3.5 py-2.5 shadow-sm"
                  onPress={() => selectLocation(location)}
                >
                  <Text className="text-xs font-bold text-[#2563EB]">
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <CountryDropdown
              onSelect={(value) => updateForm("country", value)}
              value={form.country}
            />

            <LocationPinPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(coordinates) =>
                setForm((current) => ({
                  ...current,
                  lat: coordinates.lat,
                  lng: coordinates.lng,
                }))
              }
            />

            <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
              <ChoiceGroup
                choices={propertyStatusChoices}
                label="Property Status"
                onSelect={(value) => updateForm("status", value)}
                value={form.status}
              />
            </View>

            <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
              <ChoiceGroup
                choices={propertyTypeChoices}
                label="Property Type"
                onSelect={(value) => updateForm("type", value)}
                value={form.type}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  keyboardType="decimal-pad"
                  label="Market Value"
                  onChangeText={(value) =>
                    updateForm("value", cleanDecimal(value))
                  }
                  placeholder="0"
                  value={form.value}
                />
              </View>
              <View className="w-28">
                <Field
                  keyboardType="decimal-pad"
                  label="ROI %"
                  onChangeText={(value) =>
                    updateForm("roi", cleanDecimal(value))
                  }
                  placeholder="0"
                  value={form.roi}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  keyboardType="numbers-and-punctuation"
                  label="Latitude"
                  onChangeText={(value) =>
                    updateForm("lat", cleanDecimal(value, true))
                  }
                  placeholder="0"
                  value={form.lat}
                />
              </View>
              <View className="flex-1">
                <Field
                  keyboardType="numbers-and-punctuation"
                  label="Longitude"
                  onChangeText={(value) =>
                    updateForm("lng", cleanDecimal(value, true))
                  }
                  placeholder="0"
                  value={form.lng}
                />
              </View>
            </View>

            {isResidential(form.type) ? (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field
                    keyboardType="numeric"
                    label="Bedrooms"
                    onChangeText={(value) =>
                      updateForm("bedrooms", cleanInteger(value))
                    }
                    value={form.bedrooms}
                  />
                </View>
                <View className="flex-1">
                  <Field
                    keyboardType="numeric"
                    label="Bathrooms"
                    onChangeText={(value) =>
                      updateForm("bathrooms", cleanInteger(value))
                    }
                    value={form.bathrooms}
                  />
                </View>
              </View>
            ) : null}

            <View className="rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF] p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-4">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      color="#2563EB"
                      size={22}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#1d1d1f]">
                      Transient Booking Enabled
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                      Allow short-term reservations for this property.
                    </Text>
                  </View>
                </View>
                <Switch
                  onValueChange={(value) =>
                    updateForm("isTransientBookable", value)
                  }
                  thumbColor="#FFFFFF"
                  trackColor={{ false: "#6F6D6D", true: "#2563EB" }}
                  value={form.isTransientBookable}
                />
              </View>
            </View>

            <Field
              keyboardType="decimal-pad"
              label="Occupancy %"
              onChangeText={(value) =>
                updateForm("occupancy", cleanDecimal(value))
              }
              placeholder="Optional"
              value={form.occupancy}
            />

            <Field
              label="Area"
              onChangeText={(value) => updateForm("area", value)}
              placeholder="Optional"
              value={form.area}
            />

            <Field
              label="Description"
              multiline
              onChangeText={(value) => updateForm("description", value)}
              placeholder="Optional notes"
              value={form.description}
            />

            <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                    <MaterialCommunityIcons
                      name="image-outline"
                      color="#2563EB"
                      size={22}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#1d1d1f]">
                      Property Images
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                      JPG, PNG, or WEBP. Upload up to {MAX_PROPERTY_IMAGES}.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="rounded-full bg-[#2563EB] px-4 py-2.5"
                  onPress={pickImage}
                >
                  <Text className="text-xs font-bold text-[#FFFFFF]">
                    {selectedImages.length ? "Add" : "Choose"}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedImages.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 4 }}
                >
                  {selectedImages.map((image, index) => (
                    <View
                      className="w-64 overflow-hidden rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5"
                      key={`${image.uri}:${index}`}
                    >
                      <Image
                        className="h-40 w-full"
                        resizeMode="cover"
                        source={{ uri: image.uri }}
                      />
                      <View className="flex-row items-center justify-between gap-3 p-3">
                        <Text
                          className="flex-1 text-xs font-semibold text-[#1d1d1f]"
                          numberOfLines={1}
                        >
                          {index + 1}. {image.name}
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]"
                          onPress={() => removeImage(index)}
                        >
                          <MaterialCommunityIcons
                            name="close"
                            color="#6F6D6D"
                            size={17}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-[#FFFFFF]/95 p-4 shadow-sm">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB]/5">
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      color="#2563EB"
                      size={22}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-[#1d1d1f]">
                      Property Documents
                    </Text>
                    <Text className="mt-1 text-xs leading-4 text-[#6F6D6D]">
                      PDF, DOC, DOCX, JPG, or PNG files.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className="rounded-full bg-[#2563EB] px-4 py-2.5"
                  onPress={pickDocuments}
                >
                  <Text className="text-xs font-bold text-[#FFFFFF]">
                    {selectedDocuments.length > 0 ? "Add More" : "Choose"}
                  </Text>
                </TouchableOpacity>
              </View>

              {editingProperty ? (
                <View className="rounded-2xl bg-[#2563EB]/5 px-3 py-2">
                  <Text className="text-xs leading-5 text-[#6F6D6D]">
                    Existing documents stay attached. Add files here to upload
                    more documents to this property.
                  </Text>
                </View>
              ) : null}

              {editingProperty ? (
                <View className="gap-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                    Attached Documents
                  </Text>
                  {isLoadingExistingDocuments ? (
                    <View className="h-14 justify-center rounded-2xl bg-[#2563EB]/5 px-3">
                      <ActivityIndicator color="#2563EB" />
                    </View>
                  ) : existingPropertyDocuments.length > 0 ? (
                    existingPropertyDocuments.map((document) => (
                      <TouchableOpacity
                        key={document.id}
                        activeOpacity={0.8}
                        className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
                        onPress={() => openDocument(document)}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                          <MaterialCommunityIcons
                            name="file-eye-outline"
                            color="#2563EB"
                            size={18}
                          />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text
                            className="text-xs font-bold text-[#1d1d1f]"
                            numberOfLines={1}
                          >
                            {document.name}
                          </Text>
                          <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                            {document.category} | {document.size}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="open-in-new"
                          color={document.url ? "#6F6D6D" : "#C8C8C8"}
                          size={17}
                        />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="rounded-2xl border border-dashed border-[#1d1d1f]/15 bg-[#2563EB]/5 px-3 py-4">
                      <Text className="text-center text-xs font-semibold text-[#6F6D6D]">
                        No documents attached yet.
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {selectedDocuments.length > 0 ? (
                <View className="gap-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wide text-[#6F6D6D]">
                    New Uploads
                  </Text>
                  {selectedDocuments.map((document, index) => (
                    <View
                      key={`${document.name}-${document.size ?? index}`}
                      className="flex-row items-center gap-3 rounded-2xl border border-[#1d1d1f]/10 bg-[#2563EB]/5 p-3"
                    >
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFFFFF]">
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          color="#2563EB"
                          size={18}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text
                          className="text-xs font-bold text-[#1d1d1f]"
                          numberOfLines={1}
                        >
                          {document.name}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-[#6F6D6D]">
                          {formatSelectedDocumentSize(document.size)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        className="h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF]"
                        onPress={() => removeDocument(index)}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          color="#6F6D6D"
                          size={17}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {formError ? (
              <View className="rounded-2xl border border-[#1d1d1f]/15 bg-[#1d1d1f]/5 p-4">
                <Text className="text-sm font-medium text-[#1d1d1f]">
                  {formError}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-[#1d1d1f]/10 bg-[#FFFFFF] p-6">
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10 bg-[#FFFFFF]"
                onPress={closeForm}
              >
                <Text className="text-base font-bold text-[#1d1d1f]">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                className="h-14 flex-1 items-center justify-center rounded-2xl bg-[#2563EB]"
                disabled={saveMutation.isPending}
                onPress={handleSubmit}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-base font-semibold text-[#FFFFFF]">
                    {editingProperty ? "Save Property" : "Create Property"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const propertyMapStyles = StyleSheet.create({
  locationMap: {
    flex: 1,
  },
});
