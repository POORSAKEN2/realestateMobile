import { useMemo, useState } from "react";

import { usePropertyRoomCommands } from "../api/useFloorPlans";
import type { FloorPlanFeedback } from "../../services/floorplans/contracts";
import type { FloorArea, FloorPlan, PropertyRoom } from "../../types";
import { getErrorMessage } from "../../utils/floorplans/floorPlanPresentation";
import { validateRoomBatch } from "../../utils/floorplans/floorPlanValidation";

export function useRoomBatchController({
  accessToken,
  canCreateRooms,
  canManageRooms,
  feedback,
  floorPlans,
  onNotice,
  propertyId,
  rooms,
}: {
  accessToken?: string;
  canCreateRooms: boolean;
  canManageRooms: boolean;
  feedback: FloorPlanFeedback;
  floorPlans: FloorPlan[];
  onNotice: (message: string) => void;
  propertyId: string;
  rooms: PropertyRoom[];
}) {
  const commands = usePropertyRoomCommands(propertyId, accessToken);
  const [areaId, setAreaId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [start, setStart] = useState("101");
  const [count, setCount] = useState("1");
  const area = floorPlans
    .flatMap((floor) => floor.areas)
    .find((item) => item.id === areaId);
  const floor = floorPlans.find((item) =>
    item.areas.some((floorArea) => floorArea.id === areaId),
  );
  const assignedRooms = useMemo(
    () => rooms.filter((room) => room.areaId === areaId),
    [areaId, rooms],
  );

  function open(nextArea: FloorArea) {
    if (!canManageRooms) {
      feedback.showError(
        "Room management unavailable",
        "Rooms are not supported for this property.",
      );
      return;
    }
    setAreaId(nextArea.id);
    setPrefix("");
    setStart("101");
    setCount("1");
  }

  function close() {
    setAreaId("");
  }

  async function generate() {
    if (!area || !floor) return;
    if (!canCreateRooms) {
      feedback.showError(
        "Room creation unavailable",
        "Existing room assignments can still be managed.",
      );
      return;
    }
    const validation = validateRoomBatch(prefix, start, count, rooms);
    if (!validation.ok) {
      feedback.showError(validation.title, validation.message);
      return;
    }

    try {
      for (const roomNumber of validation.value.numbers) {
        await commands.create.mutateAsync({
          roomNumber,
          floor: floor.name,
          areaId: area.id,
          status: "Vacant",
        });
      }
      const total = validation.value.numbers.length;
      onNotice(`${total} room${total === 1 ? "" : "s"} added.`);
      setStart(String(validation.value.nextStart));
    } catch (error) {
      feedback.showError(
        "Rooms could not be generated",
        getErrorMessage(error),
      );
    }
  }

  async function unassign(room: PropertyRoom) {
    try {
      await commands.update.mutateAsync({
        id: room.id,
        payload: { areaId: null },
      });
      onNotice(`Room ${room.roomNumber} unassigned.`);
    } catch (error) {
      feedback.showError(
        "Room could not be unassigned",
        getErrorMessage(error),
      );
    }
  }

  async function remove(room: PropertyRoom) {
    await commands.remove.mutateAsync(room.id);
    onNotice(`Room ${room.roomNumber} deleted.`);
  }

  return {
    area,
    assignedRooms,
    canCreateRooms,
    canManageRooms,
    close,
    count,
    floor,
    generate,
    isCreating: commands.create.isPending,
    isPending:
      commands.create.isPending ||
      commands.update.isPending ||
      commands.remove.isPending,
    isRemoving: commands.remove.isPending,
    open,
    prefix,
    remove,
    setCount,
    setPrefix,
    setStart,
    start,
    unassign,
  };
}
