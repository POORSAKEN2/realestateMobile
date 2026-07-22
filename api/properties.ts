import { API_BASE_URL, apiClient, authHeaders, unwrapData } from "./client";
import type {
  ApiEnvelope,
  CreatePropertyPayload,
  PaginatedApiData,
  Property,
  PropertyImageUpload,
  UpdatePropertyPayload,
} from "../types";

export type {
  CreatePropertyPayload,
  Property,
  UpdatePropertyPayload,
} from "../types";

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800";
const MAX_PROPERTY_IMAGES = 5;

function unwrapList(
  response:
    | ApiEnvelope<Property[]>
    | ApiEnvelope<PaginatedApiData<Property>>
    | Property[],
): Array<Record<string, any>> {
  const data: unknown =
    response &&
    typeof response === "object" &&
    !Array.isArray(response) &&
    "data" in response
      ? response.data
      : response;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as PaginatedApiData<Property>).data)
  ) {
    return (data as PaginatedApiData<Property>).data ?? [];
  }

  return [];
}

function normalizePropertyStatus(status: unknown): Property["status"] {
  const value = String(status ?? "").toUpperCase();

  if (
    value === "UNDER_CONSTRUCTION" ||
    value === "PRE_LEASED" ||
    value === "REVENUE_GENERATING" ||
    value === "PERSONAL_USE" ||
    value === "IDLE"
  ) {
    return value;
  }

  return "IDLE";
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function getImageUrl(imagePath?: string | null) {
  if (!imagePath) return "";

  const raw = imagePath.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const apiUrl = API_BASE_URL || "http://localhost:8000/api";
  const backendOrigin = apiUrl.replace(/\/api\/?$/, "");

  if (raw.startsWith("/storage/")) return `${backendOrigin}${raw}`;
  if (raw.startsWith("storage/")) return `${backendOrigin}/${raw}`;

  return `${backendOrigin}/storage/${raw.replace(/^\/+/, "")}`;
}

function normalizeProperty(property: Record<string, any>): Property {
  const mediaItems = Array.isArray(property?.media) ? property.media : [];
  const media = mediaItems[0];
  const images = Array.isArray(property?.images) ? property.images : [];
  const normalizedImages = images
    .map((image: any) => image?.url ?? image?.original_url ?? image)
    .map((image: string) => getImageUrl(image))
    .filter(Boolean);
  const normalizedMediaImages = mediaItems
    .map(
      (image: any) => image?.original_url ?? image?.url ?? image?.preview_url,
    )
    .map((image: string) => getImageUrl(image))
    .filter(Boolean);
  const rawImage =
    property?.image ??
    property?.image_url ??
    property?.imageUrl ??
    normalizedImages[0] ??
    normalizedMediaImages[0] ??
    media?.original_url ??
    media?.url ??
    media?.preview_url;
  const image =
    getImageUrl(rawImage) || normalizedImages[0] || DEFAULT_PROPERTY_IMAGE;
  const lat =
    property?.lat ??
    property?.latitude ??
    property?.coordinates?.lat ??
    property?.coordinates?.latitude;
  const lng =
    property?.lng ??
    property?.lon ??
    property?.long ??
    property?.longitude ??
    property?.coordinates?.lng ??
    property?.coordinates?.lon ??
    property?.coordinates?.long ??
    property?.coordinates?.longitude;

  return {
    ...property,
    id: String(property?.id ?? ""),
    title: property?.title ?? property?.name ?? "Untitled Property",
    location: property?.location ?? property?.address ?? "Location unavailable",
    status: normalizePropertyStatus(property?.status),
    value: Number(property?.value ?? 0),
    roi: Number(property?.roi ?? 0),
    occupancy:
      property?.occupancy !== undefined && property?.occupancy !== null
        ? Number(property.occupancy)
        : undefined,
    area: property?.area ?? property?.total_area ?? property?.totalArea,
    utilityScore: property?.utilityScore ?? property?.utility_score,
    bedrooms:
      property?.bedrooms !== undefined && property?.bedrooms !== null
        ? Number(property.bedrooms)
        : undefined,
    bathrooms:
      property?.bathrooms !== undefined && property?.bathrooms !== null
        ? Number(property.bathrooms)
        : undefined,
    lat: lat !== undefined && lat !== null ? Number(lat) : undefined,
    lng: lng !== undefined && lng !== null ? Number(lng) : undefined,
    image,
    images: Array.from(
      new Set(
        [image, ...normalizedImages, ...normalizedMediaImages].filter(Boolean),
      ),
    ),
    parentId: property?.parentId ?? property?.parent_id,
    isTransientBookable: normalizeBoolean(
      property?.isTransientBookable ??
        property?.is_transient_bookable ??
        property?.transient_bookable ??
        false,
    ),
  };
}

export async function fetchProperties(accessToken?: string) {
  const response = await apiClient.get<
    | ApiEnvelope<Property[]>
    | ApiEnvelope<PaginatedApiData<Property>>
    | Property[]
  >("/properties", { headers: authHeaders(accessToken) });
  const properties = unwrapList(response);

  return properties.map((property) => normalizeProperty(property));
}

export async function createProperty(
  payload: CreatePropertyPayload,
  accessToken?: string,
) {
  const { image, images, ...propertyFields } = payload;
  const imageUploads = normalizeImageUploads(images ?? image);
  const body = imageUploads.length
    ? toPropertyFormData(propertyFields, imageUploads)
    : payload;
  const response = await apiClient.post<ApiEnvelope<Property> | Property>(
    "/properties",
    body,
    { headers: authHeaders(accessToken) },
  );

  return normalizeProperty(unwrapData<Property>(response));
}

export async function updateProperty(
  id: string,
  payload: UpdatePropertyPayload,
  accessToken?: string,
) {
  const { image, images, ...propertyFields } = payload;
  const imageUploads = normalizeImageUploads(images ?? image);

  const stringImages = Array.isArray(images)
    ? images.filter((img): img is string => typeof img === "string")
    : typeof image === "string"
      ? [image]
      : [];

  const payloadToSubmit = {
    ...propertyFields,
    ...(stringImages.length && !payload.retained_images
      ? { retained_images: stringImages }
      : {}),
  };

  const body = imageUploads.length
    ? toPropertyFormData(payloadToSubmit, imageUploads, "PUT")
    : payloadToSubmit;
  const response = imageUploads.length
    ? await apiClient.post<ApiEnvelope<Property> | Property>(
        `/properties/${id}`,
        body,
        { headers: authHeaders(accessToken) },
      )
    : await apiClient.post<ApiEnvelope<Property> | Property>(
        `/properties/${id}?_method=PUT`,
        { ...payloadToSubmit, _method: "PUT" },
        { headers: authHeaders(accessToken) },
      );

  return normalizeProperty(unwrapData<Property>(response));
}

function toPropertyFormData(
  payload: Omit<CreatePropertyPayload, "image" | "images">,
  images: NonNullable<CreatePropertyPayload["images"]>,
  method?: "PUT",
) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(
      key,
      typeof value === "boolean" ? (value ? "1" : "0") : String(value),
    );
  });

  images.slice(0, MAX_PROPERTY_IMAGES).forEach((image) => {
    const file =
      image.file ??
      ({
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as unknown as Blob);

    formData.append("images[]", file);
  });
  if (method) formData.append("_method", method);

  return formData;
}

function normalizeImageUploads(images?: any): PropertyImageUpload[] {
  const imageList = Array.isArray(images) ? images : images ? [images] : [];
  return imageList
    .filter(
      (img): img is PropertyImageUpload =>
        typeof img === "object" && img !== null && "uri" in img,
    )
    .slice(0, MAX_PROPERTY_IMAGES);
}
