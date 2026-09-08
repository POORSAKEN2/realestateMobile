import type { CreatePropertyPayload, UpdatePropertyPayload } from "../../types";
import {
  parseInteger,
  parseNumber,
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
  options: { hasExistingImages?: boolean; includeStatus?: boolean } = {},
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
  const sqm = parseInteger(form.sqm);
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
  if (form.sqm.trim() && (sqm === undefined || sqm < 0)) {
    return { error: "Listing floor area must be a non-negative whole number." };
  }
  if (form.isPublished) {
    if (!form.ownerId) {
      return { error: "Choose a verified property owner before publishing." };
    }
    if (!form.listingMode) {
      return { error: "Choose a listing mode before publishing." };
    }
    if (!options.hasExistingImages && selectedImages.length === 0) {
      return { error: "Add at least one property image before publishing." };
    }
    if (value <= 0) {
      return { error: "Market value must be greater than 0 before publishing." };
    }
  }

  const payload: PropertyFormPayload = {
    title,
    location,
    country,
    classification: form.classification,
    type: form.type,
    value,
    roi,
    lat,
    lng,
    is_transient_bookable: form.isTransientBookable,
    is_published: form.isPublished,
    listing_mode: form.listingMode,
  };

  if (options.includeStatus !== false) payload.status = form.status;

  if (selectedImages.length > 0) payload.images = selectedImages;

  const area = form.area.trim();
  const description = form.description.trim();
  if (occupancy !== undefined) payload.occupancy = occupancy;
  if (area) payload.area = area;
  if (description) payload.description = description;
  if (form.ownerId) payload.owner_id = form.ownerId;
  if (form.listingType) payload.listing_type = form.listingType;
  if (sqm !== undefined) payload.sqm = sqm;

  if (needsRoomCounts) {
    payload.bedrooms = bedrooms;
    payload.bathrooms = bathrooms;
  }

  return { payload };
}
