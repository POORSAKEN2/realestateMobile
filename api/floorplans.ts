import {
  API_BASE_URL,
  apiClient,
  authHeaders,
  unwrapCollection,
  unwrapData,
} from "./client";
import type {
  ApiEnvelope,
  FloorArea,
  FloorAreaPayload,
  FloorPlan,
  FloorPlanImageUpload,
  FloorPlanPayload,
  FloorPlanPoint,
  PropertyRoom,
  PropertyRoomPayload,
  PropertyRoomStatus,
} from "../types";

function normalizePoints(value: unknown): FloorPlanPoint[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((point) => {
      if (!point || typeof point !== "object") return null;
      const x = Number((point as Record<string, unknown>).x);
      const y = Number((point as Record<string, unknown>).y);

      return Number.isFinite(x) && Number.isFinite(y)
        ? {
            x: Math.min(1, Math.max(0, x)),
            y: Math.min(1, Math.max(0, y)),
          }
        : null;
    })
    .filter((point): point is FloorPlanPoint => Boolean(point));
}

function normalizeArea(value: Record<string, any>): FloorArea {
  return {
    id: String(value?.id ?? ""),
    floorplanId: String(value?.floorplanId ?? value?.floorplan_id ?? ""),
    label: String(value?.label ?? "Untitled area"),
    points: normalizePoints(value?.points),
    sortOrder: Number(value?.sortOrder ?? value?.sort_order ?? 0),
    roomIds: Array.isArray(value?.roomIds ?? value?.room_ids)
      ? (value.roomIds ?? value.room_ids).map(String)
      : [],
  };
}

function normalizeMediaUrl(value: unknown) {
  const path = String(value ?? "").trim();
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;

  const origin = (API_BASE_URL || "http://localhost:8000/api").replace(
    /\/api\/?$/,
    "",
  );
  if (path.startsWith("/")) return `${origin}${path}`;

  return `${origin}/${path}`;
}

export function normalizeFloorPlan(value: Record<string, any>): FloorPlan {
  return {
    id: String(value?.id ?? ""),
    propertyId: String(value?.propertyId ?? value?.property_id ?? ""),
    name: String(value?.name ?? "Untitled floor"),
    sortOrder: Number(value?.sortOrder ?? value?.sort_order ?? 0),
    image: normalizeMediaUrl(value?.image),
    areas: Array.isArray(value?.areas)
      ? value.areas.map((area: Record<string, any>) => normalizeArea(area))
      : [],
  };
}

function normalizeRoomStatus(value: unknown): PropertyRoomStatus {
  return value === "Occupied" || value === "Maintenance" ? value : "Vacant";
}

function normalizeRoom(value: Record<string, any>): PropertyRoom {
  return {
    id: String(value?.id ?? ""),
    propertyId: String(value?.propertyId ?? value?.property_id ?? ""),
    roomNumber: String(value?.roomNumber ?? value?.room_number ?? ""),
    floor: value?.floor ?? null,
    areaId: value?.areaId ?? value?.area_id ?? null,
    points: normalizePoints(value?.points),
    type: value?.type ?? null,
    status: normalizeRoomStatus(value?.status),
    bedspaceCount: Number(value?.bedspaceCount ?? value?.bedspace_count ?? 0),
    vacantBedspaceCount: Number(
      value?.vacantBedspaceCount ?? value?.vacant_bedspace_count ?? 0,
    ),
    occupiedBedspaceCount: Number(
      value?.occupiedBedspaceCount ?? value?.occupied_bedspace_count ?? 0,
    ),
    maintenanceBedspaceCount: Number(
      value?.maintenanceBedspaceCount ?? value?.maintenance_bedspace_count ?? 0,
    ),
    notes: value?.notes ?? null,
  };
}

export async function fetchFloorPlans(
  propertyId: string,
  accessToken?: string,
) {
  const response = await apiClient.get<ApiEnvelope<FloorPlan[]> | FloorPlan[]>(
    `/properties/${propertyId}/floorplans`,
    {
      headers: authHeaders(accessToken),
    },
  );

  return unwrapCollection(response).map((floor) =>
    normalizeFloorPlan(floor as unknown as Record<string, any>),
  );
}

export async function createFloorPlan(
  propertyId: string,
  payload: FloorPlanPayload,
  accessToken?: string,
) {
  const response = await apiClient.post<ApiEnvelope<FloorPlan> | FloorPlan>(
    `/properties/${propertyId}/floorplans`,
    payload,
    { headers: authHeaders(accessToken) },
  );

  return normalizeFloorPlan(
    unwrapData(response) as unknown as Record<string, any>,
  );
}

export async function updateFloorPlan(
  floorPlanId: string,
  payload: FloorPlanPayload,
  accessToken?: string,
) {
  const response = await apiClient.put<ApiEnvelope<FloorPlan> | FloorPlan>(
    `/floorplans/${floorPlanId}`,
    payload,
    { headers: authHeaders(accessToken) },
  );

  return normalizeFloorPlan(
    unwrapData(response) as unknown as Record<string, any>,
  );
}

export async function deleteFloorPlan(
  floorPlanId: string,
  accessToken?: string,
) {
  await apiClient.delete(`/floorplans/${floorPlanId}`, {
    headers: authHeaders(accessToken),
  });
}

export async function uploadFloorPlanImage(
  floorPlanId: string,
  image: FloorPlanImageUpload,
  accessToken?: string,
) {
  const formData = new FormData();
  formData.append(
    "image",
    image.file ??
      ({
        uri: image.uri,
        name: image.name,
        type: image.type,
      } as unknown as Blob),
  );

  const response = await apiClient.post<ApiEnvelope<FloorPlan> | FloorPlan>(
    `/floorplans/${floorPlanId}/image`,
    formData,
    { headers: authHeaders(accessToken) },
  );

  return normalizeFloorPlan(
    unwrapData(response) as unknown as Record<string, any>,
  );
}

export async function createFloorArea(
  floorPlanId: string,
  payload: Required<Pick<FloorAreaPayload, "label">> & FloorAreaPayload,
  accessToken?: string,
) {
  const response = await apiClient.post<ApiEnvelope<FloorArea> | FloorArea>(
    `/floorplans/${floorPlanId}/areas`,
    payload,
    { headers: authHeaders(accessToken) },
  );

  return normalizeArea(unwrapData(response) as unknown as Record<string, any>);
}

export async function updateFloorArea(
  areaId: string,
  payload: FloorAreaPayload,
  accessToken?: string,
) {
  const response = await apiClient.put<ApiEnvelope<FloorArea> | FloorArea>(
    `/areas/${areaId}`,
    payload,
    { headers: authHeaders(accessToken) },
  );

  return normalizeArea(unwrapData(response) as unknown as Record<string, any>);
}

export async function deleteFloorArea(areaId: string, accessToken?: string) {
  await apiClient.delete(`/areas/${areaId}`, {
    headers: authHeaders(accessToken),
  });
}

export async function fetchPropertyRooms(
  propertyId: string,
  accessToken?: string,
) {
  const response = await apiClient.get<
    ApiEnvelope<PropertyRoom[]> | PropertyRoom[]
  >(`/rooms?property_id=${encodeURIComponent(propertyId)}`, {
    headers: authHeaders(accessToken),
  });

  return unwrapCollection(response).map((room) =>
    normalizeRoom(room as unknown as Record<string, any>),
  );
}

export async function createPropertyRoom(
  payload: PropertyRoomPayload,
  accessToken?: string,
) {
  const response = await apiClient.post<
    ApiEnvelope<PropertyRoom> | PropertyRoom
  >(
    "/rooms",
    {
      property_id: payload.propertyId,
      room_number: payload.roomNumber,
      floor: payload.floor,
      area_id: payload.areaId,
      points: payload.points,
      type: payload.type,
      status: payload.status,
      notes: payload.notes,
    },
    { headers: authHeaders(accessToken) },
  );

  return normalizeRoom(unwrapData(response) as unknown as Record<string, any>);
}

export async function updatePropertyRoom(
  roomId: string,
  payload: Partial<PropertyRoomPayload>,
  accessToken?: string,
) {
  const response = await apiClient.put<
    ApiEnvelope<PropertyRoom> | PropertyRoom
  >(
    `/rooms/${roomId}`,
    {
      ...(payload.propertyId !== undefined
        ? { property_id: payload.propertyId }
        : {}),
      ...(payload.roomNumber !== undefined
        ? { room_number: payload.roomNumber }
        : {}),
      ...(payload.floor !== undefined ? { floor: payload.floor } : {}),
      ...(payload.areaId !== undefined ? { area_id: payload.areaId } : {}),
      ...(payload.points !== undefined ? { points: payload.points } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
    { headers: authHeaders(accessToken) },
  );

  return normalizeRoom(unwrapData(response) as unknown as Record<string, any>);
}

export async function deletePropertyRoom(roomId: string, accessToken?: string) {
  await apiClient.delete(`/rooms/${roomId}`, {
    headers: authHeaders(accessToken),
  });
}
