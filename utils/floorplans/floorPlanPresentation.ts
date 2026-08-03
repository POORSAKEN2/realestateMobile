import type { FloorPlan, PropertyRoom } from "../../types";

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again.";
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
