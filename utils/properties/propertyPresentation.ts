import type { Property } from "../../types";
import { MAX_PROPERTY_IMAGES } from "./propertyForm";

export type PropertyStatusTone = {
  backgroundClassName: string;
  dotClassName: string;
  textClassName: string;
};

const STATUS_TONES: Record<Property["status"], PropertyStatusTone> = {
  IDLE: {
    backgroundClassName: "bg-slate-100",
    dotClassName: "bg-slate-500",
    textClassName: "text-slate-700",
  },
  PERSONAL_USE: {
    backgroundClassName: "bg-violet-50",
    dotClassName: "bg-violet-500",
    textClassName: "text-violet-700",
  },
  PRE_LEASED: {
    backgroundClassName: "bg-blue-50",
    dotClassName: "bg-blue-500",
    textClassName: "text-blue-700",
  },
  REVENUE_GENERATING: {
    backgroundClassName: "bg-emerald-50",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-700",
  },
  UNDER_CONSTRUCTION: {
    backgroundClassName: "bg-amber-50",
    dotClassName: "bg-amber-500",
    textClassName: "text-amber-700",
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

export function hasMapCoordinate(property: Property): property is Property & {
  lat: number;
  lng: number;
} {
  return (
    typeof property.lat === "number" &&
    Number.isFinite(property.lat) &&
    typeof property.lng === "number" &&
    Number.isFinite(property.lng)
  );
}

export function getPropertyCoordinate(
  property: Property & { lat: number; lng: number },
) {
  return { latitude: property.lat, longitude: property.lng };
}

export function getPropertyMarkerColor(status: Property["status"]) {
  if (status === "UNDER_CONSTRUCTION") return "#EA580C";
  if (status === "PRE_LEASED") return "#0891B2";
  if (status === "REVENUE_GENERATING") return "#16A34A";
  if (status === "PERSONAL_USE") return "#C026D3";
  return "#2563EB";
}
