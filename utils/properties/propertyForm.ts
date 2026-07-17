import type * as DocumentPicker from "expo-document-picker";
import type * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

import {
  PROPERTY_TAXONOMY,
  type DocumentUpload,
  type Property,
  type PropertyClassification,
  type PropertyDocument,
  type PropertyType,
} from "../../types";

export type StatusFilter = Property["status"] | "ALL";

export type FormState = {
  title: string;
  location: string;
  country: string;
  status: Property["status"];
  classification: PropertyClassification;
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

export type Choice<T extends string> = { label: string; value: T };

export type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file?: Blob;
};

export type SelectedDocument = DocumentUpload;

export const propertyStatusChoices: Choice<Property["status"]>[] = [
  { label: "Idle", value: "IDLE" },
  { label: "Under Construction", value: "UNDER_CONSTRUCTION" },
  { label: "Pre Leased", value: "PRE_LEASED" },
  { label: "Revenue Generating", value: "REVENUE_GENERATING" },
  { label: "Personal Use", value: "PERSONAL_USE" },
];

export const propertyClassificationChoices: Choice<PropertyClassification>[] =
  Object.keys(PROPERTY_TAXONOMY).map((classification) => ({
    label: classification,
    value: classification as PropertyClassification,
  }));

export function getPropertyTypeChoices(
  classification: PropertyClassification,
): Choice<PropertyType>[] {
  return PROPERTY_TAXONOMY[classification].map((type) => ({
    label: type,
    value: type,
  }));
}

export const seaCountryChoices: Choice<string>[] = [
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

export const statusFilterChoices: Choice<StatusFilter>[] = [
  { label: "All", value: "ALL" },
  ...propertyStatusChoices.map((choice) => ({
    label: formatStatus(choice.value),
    value: choice.value,
  })),
];

export const suggestedLocations = [
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

export const locationCoordinates: Record<string, { lat: number; lng: number }> =
  {
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

export const MAX_PROPERTY_IMAGES = 5;

export const emptyForm: FormState = {
  title: "",
  location: "",
  country: "Philippines",
  status: "IDLE",
  classification: "Residential",
  type: "Single Family Home",
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

export function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
export function formatPeso(value = 0) {
  if (value >= 1_000_000_000)
    return `PHP ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `PHP ${(value / 1_000_000).toFixed(1)}M`;
  return `PHP ${value.toLocaleString()}`;
}
export function requiresBedroomAndBathroomCounts(
  classification: PropertyClassification,
  type: PropertyType,
) {
  return classification === "Residential" && !type.includes("Building");
}
export function parseNumber(value: string) {
  const parsed = Number(value.trim().replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
export function parseInteger(value: string) {
  const parsed = parseNumber(value);
  return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}
export function cleanDecimal(value: string, allowNegative = false) {
  let cleaned = value.replace(/[^\d.,-]/g, "");
  cleaned = allowNegative
    ? cleaned.replace(/(?!^)-/g, "")
    : cleaned.replace(/-/g, "");
  const [firstPart, ...otherParts] = cleaned.split(".");
  return [firstPart, otherParts.join("")].filter(Boolean).join(".");
}
export function cleanInteger(value: string) {
  return value.replace(/\D/g, "");
}
export function formatCoordinate(value: number) {
  return value.toFixed(6);
}
export function toFormState(property: Property): FormState {
  const classification = property.classification ?? "Residential";
  const availableTypes = PROPERTY_TAXONOMY[
    classification
  ] as readonly PropertyType[];
  const propertyType =
    property.type && availableTypes.includes(property.type)
      ? property.type
      : availableTypes[0];
  return {
    title: property.title,
    location: property.location,
    country: property.country ?? "Philippines",
    status: property.status,
    classification,
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
        : requiresBedroomAndBathroomCounts(classification, propertyType)
          ? "2"
          : "",
    bathrooms:
      property.bathrooms !== undefined && property.bathrooms !== null
        ? String(property.bathrooms)
        : requiresBedroomAndBathroomCounts(classification, propertyType)
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
export function toSelectedImage(
  asset: ImagePicker.ImagePickerAsset,
): SelectedImage {
  const name =
    asset.fileName ??
    asset.uri.split("/").slice(-1)[0] ??
    `property-${Date.now()}.jpg`;
  const type =
    asset.mimeType ??
    (asset.uri.toLowerCase().endsWith(".png")
      ? "image/png"
      : asset.uri.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg");
  return {
    uri: asset.uri,
    name,
    type,
    size: asset.fileSize,
    file: asset.file,
  };
}
export function getDocumentType(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.mimeType) return asset.mimeType;
  const extension = asset.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx")
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}
export function formatSelectedDocumentSize(size?: number | null) {
  if (!size) return "N/A";
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${Math.round(size / 1_000)} KB`;
  return `${size} B`;
}
export async function openPropertyDocument(document: PropertyDocument) {
  if (!document.url) {
    Alert.alert(
      "Document unavailable",
      "This document does not have a viewable file URL.",
    );
    return;
  }
  try {
    if (!(await Linking.canOpenURL(document.url))) {
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
