import { Alert, Linking } from "react-native";

import type { AuthUser, Property, PropertyDocument } from "../../types";

const MAX_PROPERTY_IMAGES = 5;

export function calculateTrend(current: number, previous?: number) {
  if (previous === undefined || previous === 0) return null;
  const diff = ((current - previous) / previous) * 100;
  return {
    direction: diff >= 0 ? ("up" as const) : ("down" as const),
    value: `${Math.abs(diff).toFixed(1)}%`,
  };
}

export function formatPesoValue(value = 0) {
  if (value >= 1_000_000_000) return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  return value === 0 ? "₱0" : `₱${value.toLocaleString()}`;
}

export function formatPropertyStatus(status: string) {
  return status.toLowerCase().split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function getPropertyImages(property: Property) {
  const images = property.images?.length ? property.images : [property.image];
  return Array.from(new Set(images.filter(Boolean))).slice(0, MAX_PROPERTY_IMAGES);
}

export async function openPropertyDocument(document: PropertyDocument) {
  if (!document.url) {
    Alert.alert("Document unavailable", "This document does not have a viewable file URL.");
    return;
  }
  try {
    if (!(await Linking.canOpenURL(document.url))) {
      Alert.alert("Cannot open document", "No app is available to open this document.");
      return;
    }
    await Linking.openURL(document.url);
  } catch {
    Alert.alert("Cannot open document", "The document could not be opened.");
  }
}

export function isAuthUser(value: unknown): value is AuthUser {
  return typeof value === "object" && value !== null;
}

export function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "User";
  return source.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U";
}

export function formatRole(role?: string) {
  if (!role) return "Property Manager";
  return role.toLowerCase().split(/[_\s-]+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function capitalizeWords(value: string) {
  return value.toLowerCase().split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function getLeaseRoomNumber(roomNumber?: string | null) {
  return roomNumber?.trim() || "No room assigned";
}
