import type { FloorArea, PropertyRoom } from "../../types";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; title: string; message: string };

export function validateFloorName(value: string): ValidationResult<string> {
  const name = value.trim();
  return name
    ? { ok: true, value: name }
    : {
        ok: false,
        title: "Floor name required",
        message: "Enter a name such as Floor 1.",
      };
}

export function validateAreaName(
  value: string,
  areas: FloorArea[],
  editingAreaId?: string,
): ValidationResult<string> {
  const label = value.trim();
  if (!label) {
    return {
      ok: false,
      title: "Area name required",
      message: "Enter a unique area name.",
    };
  }

  const duplicate = areas.some(
    (area) =>
      area.id !== editingAreaId &&
      area.label.trim().toLowerCase() === label.toLowerCase(),
  );
  return duplicate
    ? {
        ok: false,
        title: "Area name already used",
        message: "Each area on a floor needs a unique name.",
      }
    : { ok: true, value: label };
}

export type RoomBatch = {
  numbers: string[];
  nextStart: number;
};

export function validateRoomBatch(
  prefix: string,
  startValue: string,
  countValue: string,
  rooms: PropertyRoom[],
): ValidationResult<RoomBatch> {
  const start = Number(startValue);
  const count = Number(countValue);

  if (!Number.isInteger(start) || start < 0) {
    return {
      ok: false,
      title: "Invalid start number",
      message: "Use a non-negative whole number.",
    };
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return {
      ok: false,
      title: "Invalid room count",
      message: "Generate between 1 and 100 rooms.",
    };
  }

  const normalizedPrefix = prefix.trim();
  const numbers = Array.from(
    { length: count },
    (_, index) => `${normalizedPrefix}${start + index}`,
  );
  const existing = new Set(
    rooms.map((room) => room.roomNumber.trim().toLowerCase()),
  );
  const duplicate = numbers.find((number) =>
    existing.has(number.trim().toLowerCase()),
  );
  return duplicate
    ? {
        ok: false,
        title: "Room number already exists",
        message: `${duplicate} is already used in this property.`,
      }
    : { ok: true, value: { nextStart: start + count, numbers } };
}
