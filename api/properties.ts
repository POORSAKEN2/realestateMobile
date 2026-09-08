import {
  API_BASE_URL,
  apiClient,
  authHeaders,
  unwrapCollection,
  unwrapData,
} from "./client";
import { normalizeFloorPlan } from "./floorplans";
import type {
  ApiEnvelope,
  CreatePropertyPayload,
  PaginatedApiData,
  Property,
  PropertyImageUpload,
  PropertyStatus,
  PropertyStatusHistoryEntry,
  PropertySpatialCapabilities,
  SpatialCapabilityLevel,
  UpdatePropertyPayload,
} from "../types";
import { assertPropertyTransition } from "../utils/properties/propertyLifecycle";

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

function parsePropertyStatus(status: unknown): Property["status"] | null {
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

  return null;
}

function normalizePropertyStatus(status: unknown): Property["status"] {
  return parsePropertyStatus(status) ?? "IDLE";
}

function normalizePropertyStatusHistory(
  value: unknown,
): PropertyStatusHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];

    const source = item as Record<string, any>;
    const fromStatus = parsePropertyStatus(
      source.fromStatus ?? source.from_status,
    );
    const toStatus = parsePropertyStatus(source.toStatus ?? source.to_status);
    if (!fromStatus || !toStatus) return [];
    const createdAt = String(
      source.createdAt ?? source.created_at ?? new Date(0).toISOString(),
    );

    return [
      {
        id: String(
          source.id ?? `${fromStatus}:${toStatus}:${createdAt}:${index}`,
        ),
        fromStatus,
        toStatus,
        reason:
          typeof source.reason === "string" && source.reason.trim()
            ? source.reason.trim()
            : undefined,
        actorName:
          source.actorName ??
          source.actor_name ??
          source.actor?.name ??
          undefined,
        createdAt,
      },
    ];
  });
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const SPATIAL_CAPABILITY_LEVELS = new Set<SpatialCapabilityLevel>([
  "recommended",
  "optional",
  "discouraged",
  "unsupported",
]);

function normalizeSpatialCapabilities(
  value: unknown,
): PropertySpatialCapabilities | undefined {
  if (!value || typeof value !== "object") return undefined;

  const source = value as Record<string, unknown>;
  const floorplans = String(source.floorplans ?? "").toLowerCase();
  const rooms = String(source.rooms ?? "").toLowerCase();
  const normalized: PropertySpatialCapabilities = {};

  if (SPATIAL_CAPABILITY_LEVELS.has(floorplans as SpatialCapabilityLevel)) {
    normalized.floorplans = floorplans as SpatialCapabilityLevel;
  }
  if (SPATIAL_CAPABILITY_LEVELS.has(rooms as SpatialCapabilityLevel)) {
    normalized.rooms = rooms as SpatialCapabilityLevel;
  }

  return normalized.floorplans || normalized.rooms ? normalized : undefined;
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

export function normalizeProperty(property: Record<string, any>): Property {
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
  const actualImages = Array.from(
    new Set(
      [
        getImageUrl(rawImage),
        ...normalizedImages,
        ...normalizedMediaImages,
      ].filter(Boolean),
    ),
  );
  const image = actualImages[0] || DEFAULT_PROPERTY_IMAGE;
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
    statusHistory: normalizePropertyStatusHistory(
      property?.statusHistory ?? property?.status_history,
    ),
    value: Number(property?.value ?? 0),
    roi: Number(property?.roi ?? 0),
    occupancy:
      property?.occupancy !== undefined && property?.occupancy !== null
        ? Number(property.occupancy)
        : undefined,
    roomCount: Number(property?.roomCount ?? property?.room_count ?? 0),
    bedspaceCount: Number(
      property?.bedspaceCount ?? property?.bedspace_count ?? 0,
    ),
    vacantBedspaceCount: Number(
      property?.vacantBedspaceCount ?? property?.vacant_bedspace_count ?? 0,
    ),
    occupiedBedspaceCount: Number(
      property?.occupiedBedspaceCount ?? property?.occupied_bedspace_count ?? 0,
    ),
    maintenanceBedspaceCount: Number(
      property?.maintenanceBedspaceCount ??
        property?.maintenance_bedspace_count ??
        0,
    ),
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
    images: actualImages,
    parentId: property?.parentId ?? property?.parent_id,
    isTransientBookable: normalizeBoolean(
      property?.isTransientBookable ??
        property?.is_transient_bookable ??
        property?.transient_bookable ??
        false,
    ),
    totalUnits:
      property?.totalUnits !== undefined && property?.totalUnits !== null
        ? Number(property.totalUnits)
        : property?.total_units !== undefined && property?.total_units !== null
          ? Number(property.total_units)
          : undefined,
    street: property?.street ?? undefined,
    city: property?.city ?? undefined,
    postal_code: property?.postal_code ?? property?.postalCode ?? undefined,
    postalCode: property?.postal_code ?? property?.postalCode ?? undefined,
    isPublished: normalizeBoolean(
      property?.isPublished ??
        property?.is_published ??
        property?.isPublicListed ??
        property?.is_public_listed ??
        false,
    ),
    listingMode: property?.listingMode ?? property?.listing_mode ?? undefined,
    listingType: property?.listingType ?? property?.listing_type ?? undefined,
    sqm:
      property?.sqm !== undefined && property?.sqm !== null
        ? Number(property.sqm)
        : undefined,
    ownerId: property?.ownerId ?? property?.owner_id ?? undefined,
    description: property?.description ?? undefined,
    floorplans: Array.isArray(property?.floorplans)
      ? property.floorplans.map((floorPlan: Record<string, any>) =>
          normalizeFloorPlan(floorPlan),
        )
      : [],
    spatialCapabilities: normalizeSpatialCapabilities(
      property?.spatialCapabilities ?? property?.spatial_capabilities,
    ),
  };
}

export async function fetchProperties(accessToken?: string) {
  const properties: Property[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const response = await apiClient.get<any>(`/properties?page=${page}`, { headers: authHeaders(accessToken) });
    properties.push(...unwrapList(response).map(normalizeProperty));
    const payload = response?.data ?? response;
    const pagination = payload?.meta ?? payload;
    const advertisedLastPage = Number(pagination?.last_page ?? 1);
    lastPage = Number.isInteger(advertisedLastPage) && advertisedLastPage > 0 ? advertisedLastPage : 1;
    page += 1;
  } while (page <= lastPage);
  return [...new Map(properties.map((property) => [property.id, property])).values()];
}

export async function fetchProperty(id: string, accessToken?: string) {
  const response = await apiClient.get<ApiEnvelope<Property> | Property>(
    `/properties/${id}`,
    { headers: authHeaders(accessToken) },
  );

  return normalizeProperty(
    unwrapData(response) as unknown as Record<string, any>,
  );
}

export async function syncPropertyManagers(id: string, managerIds: string[], accessToken?: string) {
  const response = await apiClient.post<ApiEnvelope<Property>>(
    `/properties/${encodeURIComponent(id)}/managers`, { manager_ids: managerIds },
    { headers: authHeaders(accessToken), access: { permission: "staff.manage", propertyId: id } },
  );
  return normalizeProperty(unwrapData(response) as Property);
}

export async function fetchPropertyStatusHistory(
  id: string,
  accessToken?: string,
) {
  const response = await apiClient.get<
    ApiEnvelope<PropertyStatusHistoryEntry[]> | PropertyStatusHistoryEntry[]
  >(`/properties/${encodeURIComponent(id)}/status-history`, {
    headers: authHeaders(accessToken),
    access: { permission: "properties.view", propertyId: id },
  });

  return normalizePropertyStatusHistory(unwrapCollection(response));
}

export type PropertyLifecycleTransitionResult = {
  property: Property;
  historyEntry: PropertyStatusHistoryEntry;
};

export async function transitionPropertyLifecycle(
  id: string,
  fromStatus: PropertyStatus,
  toStatus: PropertyStatus,
  accessToken?: string,
): Promise<PropertyLifecycleTransitionResult> {
  assertPropertyTransition(fromStatus, toStatus);

  const response = await apiClient.patch<ApiEnvelope<Property> | Property>(
    `/properties/${encodeURIComponent(id)}`,
    { status: toStatus },
    {
      headers: authHeaders(accessToken),
      access: { permission: "properties.update", propertyId: id },
    },
  );
  const property = normalizeProperty(unwrapData<Property>(response));
  const serverEntry = property.statusHistory?.find(
    (entry) =>
      entry.fromStatus === fromStatus && entry.toStatus === property.status,
  );

  return {
    property,
    historyEntry:
      serverEntry ??
      {
        id: `${id}:${fromStatus}:${property.status}:${Date.now()}`,
        fromStatus,
        toStatus: property.status,
        createdAt: new Date().toISOString(),
      },
  };
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
  payload: Partial<Omit<CreatePropertyPayload, "image" | "images">>,
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
