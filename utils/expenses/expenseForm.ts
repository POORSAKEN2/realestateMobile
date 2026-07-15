import type * as DocumentPicker from "expo-document-picker";
import type * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

import {
  Property,
  PROPERTY_TAXONOMY,
  PropertyClassification,
  PropertyDocument,
  PropertyType,
} from "../../types";
import { Expense, EXPENSE_TAXONOMY } from "../../types/domain/expenses";

export type FormState = {
  linkedAsset: string;
  category: string;
  amount: string;
  date: string;
  referenceNumber: string;
  description: string;
  status: Expense["status"];
};

export type Choice<T extends string> = { label: string; value: T };

export type SelectedImage = {
  uri: string;
  name: string;
  type: string;
  file?: Blob;
};

export const expenseClassificationChoices: Choice<PropertyClassification>[] =
  Object.keys(EXPENSE_TAXONOMY).map((classification) => ({
    label: classification,
    value: classification as PropertyClassification,
  }));

export const MAX_PROPERTY_IMAGES = 5;

export const emptyForm: FormState = {
  linkedAsset: "",
  category: "",
  amount: "",
  date: "",
  status: "PENDING",
  referenceNumber: "",
  description: "",
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
export function toFormState(expense: Expense): FormState {
  const classification = expense.classification ?? "Residential";
  const availableTypes = PROPERTY_TAXONOMY[
    classification
  ] as readonly PropertyType[];
  const expenseType =
    expense.type && availableTypes.includes(expense.type)
      ? expense.type
      : availableTypes[0];
  return {
    status: expense.status,
    description: "",
    linkedAsset: "",
    category: "",
    amount: "",
    date: "",
    referenceNumber: "",
  };
}
export function toSelectedImage(
  asset: ImagePicker.ImagePickerAsset,
): SelectedImage {
  const name =
    asset.fileName ??
    asset.uri.split("/").slice(-1)[0] ??
    `expense-${Date.now()}.jpg`;
  const type =
    asset.mimeType ??
    (asset.uri.toLowerCase().endsWith(".png")
      ? "image/png"
      : asset.uri.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg");
  return { uri: asset.uri, name, type, file: asset.file };
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
