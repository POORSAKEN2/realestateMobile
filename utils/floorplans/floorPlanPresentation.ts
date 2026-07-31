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
