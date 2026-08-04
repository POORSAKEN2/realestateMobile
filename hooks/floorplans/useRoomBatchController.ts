import { useMemo, useState } from "react";

import { usePropertyRoomCommands } from "../api/useFloorPlans";
import { useSnackbar } from "../useSnackbar";
import type { FloorPlanFeedback } from "../../services/floorplans/contracts";
import type { FloorArea, FloorPlan, PropertyRoom } from "../../types";
import {
  getErrorMessage,
  getLinkableFloorRooms,
} from "../../utils/floorplans/floorPlanPresentation";
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
  const [start, setStart] = useState("");
  const [count, setCount] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const batchSnackbar = useSnackbar();
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
  const availableRooms = useMemo(
    () => getLinkableFloorRooms(floor, rooms),
    [floor, rooms],
  );
  const batchValidation = useMemo(
    () => validateRoomBatch(prefix, start, count, rooms),
    [count, prefix, rooms, start],
  );
  const canGenerate = canCreateRooms && batchValidation.ok;

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
    setStart("");
    setCount("");
    setSelectedRoomId("");
    batchSnackbar.dismiss();
  }

  function close() {
    setAreaId("");
    setSelectedRoomId("");
    batchSnackbar.dismiss();
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
    if (!batchValidation.ok) {
      feedback.showError(batchValidation.title, batchValidation.message);
      return;
    }

    try {
      for (const roomNumber of batchValidation.value.numbers) {
        await commands.create.mutateAsync({
          roomNumber,
          floor: floor.name,
          areaId: area.id,
          status: "Vacant",
        });
      }
      const total = batchValidation.value.numbers.length;
      batchSnackbar.show(`${total} room${total === 1 ? "" : "s"} added.`);
      setStart("");
      setCount("");
    } catch (error) {
      feedback.showError(
        "Rooms could not be generated",
        getErrorMessage(error),
      );
    }
  }

  async function linkSelectedRoom() {
    if (!area || !selectedRoomId) return;
    const room = availableRooms.find((item) => item.id === selectedRoomId);
    if (!room) {
      feedback.showError(
        "Room unavailable",
        "Select an unassigned room from this floor.",
      );
      return;
    }

    try {
      setIsLinking(true);
      await commands.update.mutateAsync({
        id: room.id,
        payload: { areaId: area.id },
      });
      setSelectedRoomId("");
      onNotice(`Room ${room.roomNumber} linked to ${area.label}.`);
    } catch (error) {
      feedback.showError("Room could not be linked", getErrorMessage(error));
    } finally {
      setIsLinking(false);
    }
  }

  return {
    area,
    assignedRooms,
    availableRooms,
    batchSnackbar: {
      dismiss: batchSnackbar.dismiss,
      message: batchSnackbar.message,
    },
    canGenerate,
    canCreateRooms,
    canManageRooms,
    close,
    count,
    floor,
    generate,
    isCreating: commands.create.isPending,
    isLinking,
    isPending: commands.create.isPending || commands.update.isPending,
    open,
    prefix,
    selectedRoomId,
    setCount,
    setPrefix,
    setSelectedRoomId,
    setStart,
    start,
    linkSelectedRoom,
  };
}
