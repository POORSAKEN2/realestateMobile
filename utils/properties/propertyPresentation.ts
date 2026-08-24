import type { Property } from "../../types";
import { colors } from "../../constants/colors";
import { MAX_PROPERTY_IMAGES } from "./propertyForm";

export type PropertyStatusTone = {
  backgroundClassName: string;
  dotClassName: string;
  textClassName: string;
};

export type MappedProperty = Property & { lat: number; lng: number };

const STATUS_TONES: Record<Property["status"], PropertyStatusTone> = {
  IDLE: {
    backgroundClassName: "bg-surface",
    dotClassName: "bg-description/50",
    textClassName: "text-description",
  },
  PERSONAL_USE: {
    backgroundClassName: "bg-primary/10",
    dotClassName: "bg-primary",
    textClassName: "text-primary",
  },
  PRE_LEASED: {
    backgroundClassName: "bg-infoSurface",
    dotClassName: "bg-info",
    textClassName: "text-info",
  },
  REVENUE_GENERATING: {
    backgroundClassName: "bg-successSurface",
    dotClassName: "bg-success",
    textClassName: "text-success",
  },
  UNDER_CONSTRUCTION: {
    backgroundClassName: "bg-warningSurface",
    dotClassName: "bg-warning",
    textClassName: "text-warning",
  },
};

export function getPropertyImages(property: Property): string[] {
  const images = property.images?.length ? property.images : [property.image];

  return Array.from(new Set(images.filter(Boolean))).slice(
    0,
    MAX_PROPERTY_IMAGES,
  );
}

export function getPropertyStatusTone(
  status: Property["status"],
): PropertyStatusTone {
  return STATUS_TONES[status];
}

export function hasMapCoordinate(
  property: Property,
): property is MappedProperty {
  return (
    typeof property.lat === "number" &&
    Number.isFinite(property.lat) &&
    typeof property.lng === "number" &&
    Number.isFinite(property.lng)
  );
}

export function getPropertyCoordinate(property: MappedProperty) {
  return { latitude: property.lat, longitude: property.lng };
}

export function getPropertyMarkerColor(status: Property["status"]) {
  if (status === "UNDER_CONSTRUCTION") return colors.warning;
  if (status === "PRE_LEASED") return colors.info;
  if (status === "REVENUE_GENERATING") return colors.success;
  if (status === "PERSONAL_USE") return colors.primary;
  return colors.info;
}
