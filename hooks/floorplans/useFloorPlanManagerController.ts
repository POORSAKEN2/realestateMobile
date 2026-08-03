import { useEffect, useState } from "react";

import {
  useFloorAreaCommands,
  useFloorCommands,
  useFloorPlanQueries,
} from "../api/useFloorPlans";
import type { FloorPlanManagerDependencies } from "../../services/floorplans/contracts";
import type {
  FloorArea,
  FloorPlan,
  FloorPlanDrawingMode,
  SpatialCapabilityLevel,
} from "../../types";
import { getErrorMessage } from "../../utils/floorplans/floorPlanPresentation";
import {
  validateAreaName,
  validateFloorName,
} from "../../utils/floorplans/floorPlanValidation";
import { useFloorPlanVisibility } from "./useFloorPlanVisibility";
import { useRoomBatchController } from "./useRoomBatchController";

export type NamedFloorPlanForm = {
  id?: string;
  value: string;
};

export type FloorPlanDrawingState = {
  areaId: string;
  mode: FloorPlanDrawingMode;
};

export type FloorPlanDeleteTarget =
  | { kind: "floor"; item: FloorPlan }
  | { kind: "area"; item: FloorArea };

export function useFloorPlanManagerController({
  accessToken,
  dependencies,
  floorPlanCapability = "optional",
  propertyId,
  roomCapability = "optional",
}: {
  accessToken?: string;
  dependencies: FloorPlanManagerDependencies;
  floorPlanCapability?: SpatialCapabilityLevel;
  propertyId: string;
  roomCapability?: SpatialCapabilityLevel;
}) {
  const queries = useFloorPlanQueries(propertyId, accessToken);
  const floorCommands = useFloorCommands(propertyId, accessToken);
  const areaCommands = useFloorAreaCommands(propertyId, accessToken);
  const floorPlans = queries.floorPlans.data ?? [];
  const rooms = queries.rooms.data ?? [];
  const [activeFloorId, setActiveFloorId] = useState("");
  const [floorForm, setFloorForm] = useState<NamedFloorPlanForm | null>(null);
  const [areaForm, setAreaForm] = useState<NamedFloorPlanForm | null>(null);
  const [drawing, setDrawing] = useState<FloorPlanDrawingState | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<FloorPlanDeleteTarget | null>(null);
  const [notice, setNotice] = useState("");
  const visibility = useFloorPlanVisibility(
    propertyId,
    dependencies.visibilityRepository,
  );
  const canManageRooms = roomCapability !== "unsupported" || rooms.length > 0;
  const canCreateRooms =
    roomCapability !== "unsupported" &&
    (roomCapability !== "discouraged" || rooms.length > 0);
  const roomBatch = useRoomBatchController({
    accessToken,
    canCreateRooms,
    canManageRooms,
    feedback: dependencies.feedback,
    floorPlans,
    onNotice: setNotice,
    propertyId,
    rooms,
  });

  useEffect(() => {
    if (!floorPlans.length) {
      setActiveFloorId("");
      return;
    }
    if (!floorPlans.some((floor) => floor.id === activeFloorId)) {
      setActiveFloorId(floorPlans[0].id);
    }
  }, [activeFloorId, floorPlans]);

  const activeFloor =
    floorPlans.find((floor) => floor.id === activeFloorId) ?? floorPlans[0];
  const drawingArea =
    activeFloor?.areas.find((area) => area.id === drawing?.areaId) ?? null;
  const totalAreas = floorPlans.reduce(
    (total, floor) => total + floor.areas.length,
    0,
  );

  function verifyFloorPlanImage() {
    if (activeFloor?.image) return true;

    dependencies.feedback.showError(
      "Floor plan image required",
      `Upload an image for ${activeFloor?.name ?? "this floor"} before drawing area shapes.`,
    );
    return false;
  }

  function reportValidation(
    validation: { ok: false; title: string; message: string } | { ok: true },
  ) {
    if (!validation.ok) {
      dependencies.feedback.showError(validation.title, validation.message);
      return false;
    }
    return true;
  }

  async function submitFloorForm() {
    if (!floorForm) return;
    if (!floorForm.id && floorPlanCapability === "unsupported") {
      dependencies.feedback.showError(
        "Floor creation unavailable",
        "New floor plans are not supported for this property.",
      );
      return;
    }
    const validation = validateFloorName(floorForm.value);
    if (!reportValidation(validation) || !validation.ok) return;

    try {
      if (floorForm.id) {
        await floorCommands.update.mutateAsync({
          id: floorForm.id,
          name: validation.value,
        });
      } else {
        const created = await floorCommands.create.mutateAsync(
          validation.value,
        );
        setActiveFloorId(created.id);
      }
      setFloorForm(null);
      setNotice(floorForm.id ? "Floor renamed." : "Floor added.");
    } catch (error) {
      dependencies.feedback.showError(
        "Floor could not be saved",
        getErrorMessage(error),
      );
    }
  }

  async function submitAreaForm() {
    if (!activeFloor || !areaForm) return;
    const validation = validateAreaName(
      areaForm.value,
      activeFloor.areas,
      areaForm.id,
    );
    if (!reportValidation(validation) || !validation.ok) return;

    try {
      if (areaForm.id) {
        await areaCommands.update.mutateAsync({
          id: areaForm.id,
          payload: { label: validation.value },
        });
      } else {
        await areaCommands.create.mutateAsync({
          floorPlanId: activeFloor.id,
          label: validation.value,
        });
      }
      setAreaForm(null);
      setNotice(
        areaForm.id ? "Area renamed." : "Area added. Draw its shape next.",
      );
    } catch (error) {
      dependencies.feedback.showError(
        "Area could not be saved",
        getErrorMessage(error),
      );
    }
  }

  async function saveShape(points: FloorArea["points"]) {
    if (!drawingArea) return;
    if (!verifyFloorPlanImage()) {
      setDrawing(null);
      return;
    }
    try {
      await areaCommands.update.mutateAsync({
        id: drawingArea.id,
        payload: { points },
      });
      setDrawing(null);
      setNotice(`${drawingArea.label} shape saved.`);
    } catch (error) {
      dependencies.feedback.showError(
        "Shape could not be saved",
        getErrorMessage(error),
      );
    }
  }

  async function pickFloorPlanImage() {
    if (!activeFloor) return;
    try {
      const selection = await dependencies.imagePicker.select();
      if (selection.status === "permission-denied") {
        dependencies.feedback.showError(
          "Photo access needed",
          "Allow photo library access to select a floor plan image.",
        );
        return;
      }
      if (selection.status !== "selected") return;

      await floorCommands.uploadImage.mutateAsync({
        floorPlanId: activeFloor.id,
        image: selection.image,
      });
      setNotice("Floor plan image updated.");
    } catch (error) {
      dependencies.feedback.showError(
        "Image could not be uploaded",
        getErrorMessage(error),
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "floor") {
        await floorCommands.remove.mutateAsync(deleteTarget.item.id);
        setNotice("Floor and its areas deleted.");
      } else {
        await areaCommands.remove.mutateAsync(deleteTarget.item.id);
        visibility.forget(deleteTarget.item.id);
        setNotice("Area deleted. Assigned rooms kept and unassigned.");
      }
      setDeleteTarget(null);
    } catch (error) {
      dependencies.feedback.showError(
        "Item could not be deleted",
        getErrorMessage(error),
      );
    }
  }

  function openDrawing(areaId: string, mode: FloorPlanDrawingMode) {
    if (!verifyFloorPlanImage()) return;

    setDrawing({ areaId, mode });
  }

  const isBusy =
    floorCommands.create.isPending ||
    floorCommands.update.isPending ||
    floorCommands.remove.isPending ||
    floorCommands.uploadImage.isPending ||
    areaCommands.create.isPending ||
    areaCommands.update.isPending ||
    areaCommands.remove.isPending ||
    roomBatch.isPending;

  return {
    actions: {
      clearNotice: () => setNotice(""),
      closeAreaForm: () => setAreaForm(null),
      closeDrawing: () => setDrawing(null),
      closeFloorForm: () => setFloorForm(null),
      confirmDelete,
      openAreaCreate: () =>
        activeFloor &&
        setAreaForm({ value: `Area ${activeFloor.areas.length + 1}` }),
      openAreaDelete: (item: FloorArea) =>
        setDeleteTarget({ kind: "area", item }),
      openAreaEdit: (item: FloorArea) =>
        setAreaForm({ id: item.id, value: item.label }),
      openDrawing,
      openFloorCreate: () => {
        if (floorPlanCapability === "unsupported") {
          dependencies.feedback.showError(
            "Floor creation unavailable",
            "New floor plans are not supported for this property.",
          );
          return;
        }
        setFloorForm({ value: `Floor ${floorPlans.length + 1}` });
      },
      openFloorDelete: (item: FloorPlan) =>
        setDeleteTarget({ kind: "floor", item }),
      openFloorEdit: (item: FloorPlan) =>
        setFloorForm({ id: item.id, value: item.name }),
      pickFloorPlanImage,
      saveShape,
      selectFloor: (id: string) => {
        setActiveFloorId(id);
        setDrawing(null);
      },
      setAreaFormValue: (value: string) =>
        setAreaForm((current) => (current ? { ...current, value } : null)),
      setDeleteTarget,
      setFloorFormValue: (value: string) =>
        setFloorForm((current) => (current ? { ...current, value } : null)),
      submitAreaForm,
      submitFloorForm,
    },
    activeFloor,
    areaForm,
    deleteTarget,
    drawing,
    drawingArea,
    floorForm,
    floorPlans,
    isBusy,
    notice,
    pending: {
      areaForm: areaCommands.create.isPending || areaCommands.update.isPending,
      delete: floorCommands.remove.isPending || areaCommands.remove.isPending,
      floorForm:
        floorCommands.create.isPending || floorCommands.update.isPending,
      shape: areaCommands.update.isPending,
    },
    queries,
    roomBatch,
    rooms,
    totalAreas,
    visibility,
  };
}

export type FloorPlanManagerController = ReturnType<
  typeof useFloorPlanManagerController
>;
