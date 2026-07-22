import type { CreatePropertyPayload, UpdatePropertyPayload } from "../../types";
import {
  parseInteger,
  parseNumber,
  propertySupportsTransientBooking,
  requiresBedroomAndBathroomCounts,
  type FormState,
  type SelectedImage,
} from "./propertyForm";

export type PropertyFormPayload = CreatePropertyPayload | UpdatePropertyPayload;

export type PropertyPayloadResult =
  | { payload: PropertyFormPayload; error?: never }
  | { payload?: never; error: string };

export function buildPropertyPayload(
  form: FormState,
  selectedImages: SelectedImage[],
): PropertyPayloadResult {
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
  const needsRoomCounts = requiresBedroomAndBathroomCounts(
    form.classification,
    form.type,
  );

  if (!title || !location || !country) {
    return { error: "Property title, location, and country are required." };
  }
  if (value === undefined || value < 0) {
    return { error: "Market value must be a valid number of 0 or greater." };
  }
  if (roi === undefined) {
    return { error: "Expected ROI must be a valid number." };
  }
  if (lat === undefined || lng === undefined) {
    return {
      error:
        "A property pin is required. Open the map and place the pin at the property's location.",
    };
  }
  if (
    form.occupancy.trim() &&
    (occupancy === undefined || occupancy < 0 || occupancy > 100)
  ) {
    return { error: "Occupancy must be a valid percentage from 0 to 100." };
  }
  if (needsRoomCounts && bedrooms === undefined) {
    return { error: "Bedrooms must be a non-negative whole number." };
  }
  if (needsRoomCounts && bathrooms === undefined) {
    return { error: "Bathrooms must be a non-negative whole number." };
  }

  const payload: PropertyFormPayload = {
    title,
    location,
    country,
    status: form.status,
    classification: form.classification,
    type: form.type,
    value,
    roi,
    lat,
    lng,
    is_transient_bookable: propertySupportsTransientBooking(form.classification, form.type)
      ? form.isTransientBookable
      : false,
  };

  if (selectedImages.length > 0) payload.images = selectedImages;

  const area = form.area.trim();
  const description = form.description.trim();
  if (occupancy !== undefined) payload.occupancy = occupancy;
  if (area) payload.area = area;
  if (description) payload.description = description;

  if (needsRoomCounts) {
    payload.bedrooms = bedrooms;
    payload.bathrooms = bathrooms;
  }

  return { payload };
}
