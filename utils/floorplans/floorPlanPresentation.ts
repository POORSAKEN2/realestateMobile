import type { FloorPlan, PropertyRoom, PropertyRoomStatus } from "../../types";

export const ROOM_STATUS_OPTIONS = [
  { label: "Vacant", value: "Vacant" },
  { label: "Occupied", value: "Occupied" },
  { label: "Under repair", value: "Maintenance" },
] as const satisfies readonly {
  label: string;
  value: PropertyRoomStatus;
}[];

export type RoomStatusFilter = "ALL" | PropertyRoomStatus;

export const ROOM_STATUS_FILTER_OPTIONS: {
  label: string;
  value: RoomStatusFilter;
}[] = [{ label: "All", value: "ALL" }, ...ROOM_STATUS_OPTIONS];

export function filterAssignedRooms(
  rooms: PropertyRoom[],
  searchQuery: string,
  statusFilter: RoomStatusFilter,
) {
  const query = searchQuery.trim().toLocaleLowerCase();

  return rooms.filter(
    (room) =>
      (statusFilter === "ALL" || room.status === statusFilter) &&
      (!query || room.roomNumber.toLocaleLowerCase().includes(query)),
  );
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
}

export function getRoomStatusLabel(status: PropertyRoomStatus) {
  return (
    ROOM_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    status
  );
}

export function getFloorRoomCount(floor: FloorPlan, rooms: PropertyRoom[]) {
  const areaIds = new Set(floor.areas.map((area) => area.id));
  return rooms.filter(
    (room) =>
      room.floor === floor.name ||
      (room.areaId ? areaIds.has(room.areaId) : false),
  ).length;
}

export function getLinkableFloorRooms(
  floor: FloorPlan | undefined,
  rooms: PropertyRoom[],
) {
  if (!floor) return [];

  return rooms
    .filter((room) => !room.areaId && room.floor === floor.name)
    .sort((left, right) =>
      left.roomNumber.localeCompare(right.roomNumber, undefined, {
        numeric: true,
      }),
    );
}
