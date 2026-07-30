import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { FloorPlanManagerHeader } from "../../components/floorplans/FloorPlanManagerHeader";
import {
  AreaNameModal,
  FloorNameModal,
  RoomBatchModal,
} from "../../components/floorplans/FloorPlanManagerModals";
import {
  EmptyFloorPlanState,
  FloorPlanErrorState,
  FloorPlanLoadingState,
  MissingPropertyState,
} from "../../components/floorplans/FloorPlanManagerState";
import { FloorPlanWorkspace } from "../../components/floorplans/FloorPlanWorkspace";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Screen } from "../../components/ui/Screen";
import { useFloorPlanManagerController } from "../../hooks/floorplans/useFloorPlanManagerController";
import { useAuth } from "../../hooks/useAuth";
import { deviceFloorPlanDependencies } from "../../services/floorplans/deviceFloorPlanServices";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function deleteDescription(
  target: ReturnType<typeof useFloorPlanManagerController>["deleteTarget"],
) {
  if (target?.kind === "floor") {
    return `Delete ${target.item.name}? Its areas and plan image will also be removed. Rooms remain in property.`;
  }
  if (target?.kind === "area") {
    return `Delete ${target.item.label}? Assigned rooms remain but become unassigned.`;
  }
  if (target?.kind === "room") {
    return `Delete room ${target.item.roomNumber}? This cannot be undone.`;
  }
  return "";
}

function deleteTitle(
  target: ReturnType<typeof useFloorPlanManagerController>["deleteTarget"],
) {
  return target?.kind === "floor"
    ? "Delete floor?"
    : target?.kind === "area"
      ? "Delete area?"
      : "Delete room?";
}

export default function FloorPlansScreen() {
  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    propertyTitle?: string | string[];
  }>();
  const propertyId = firstParam(params.propertyId);
  const propertyTitle = firstParam(params.propertyTitle) || "Property";
  const { session } = useAuth();
  const controller = useFloorPlanManagerController({
    accessToken: session?.accessToken,
    dependencies: deviceFloorPlanDependencies,
    propertyId,
  });

  if (!propertyId) {
    return (
      <Screen className="bg-[#F5F7FC]">
        <MissingPropertyState onBack={() => router.back()} />
      </Screen>
    );
  }

  const { actions, roomBatch } = controller;
  const isLoading =
    controller.queries.floorPlans.isLoading ||
    controller.queries.rooms.isLoading;
  const isError =
    controller.queries.floorPlans.isError || controller.queries.rooms.isError;

  return (
    <Screen className="bg-[#F5F7FC]">
      <View className="flex-1">
        <FloorPlanManagerHeader
          floorCount={controller.floorPlans.length}
          notice={controller.notice}
          onAddFloor={actions.openFloorCreate}
          onBack={() => router.back()}
          onClearNotice={actions.clearNotice}
          propertyTitle={propertyTitle}
          roomCount={controller.rooms.length}
          totalAreas={controller.totalAreas}
        />

        {isLoading ? (
          <FloorPlanLoadingState />
        ) : isError ? (
          <FloorPlanErrorState
            onRetry={() => {
              controller.queries.floorPlans.refetch();
              controller.queries.rooms.refetch();
            }}
          />
        ) : !controller.activeFloor ? (
          <EmptyFloorPlanState onCreate={actions.openFloorCreate} />
        ) : (
          <FloorPlanWorkspace
            activeFloor={controller.activeFloor}
            drawingArea={controller.drawingArea}
            drawingMode={controller.drawing?.mode ?? null}
            floorPlans={controller.floorPlans}
            hiddenAreaIds={controller.visibility.hiddenAreaIds}
            isShapeSaving={controller.pending.shape}
            onAddArea={actions.openAreaCreate}
            onCancelDrawing={actions.closeDrawing}
            onDeleteArea={actions.openAreaDelete}
            onDeleteFloor={actions.openFloorDelete}
            onDrawArea={actions.openDrawing}
            onManageRooms={roomBatch.open}
            onPickImage={actions.pickFloorPlanImage}
            onRenameArea={actions.openAreaEdit}
            onRenameFloor={actions.openFloorEdit}
            onSaveShape={actions.saveShape}
            onSelectFloor={actions.selectFloor}
            onToggleAreaVisibility={controller.visibility.toggle}
            rooms={controller.rooms}
          />
        )}
      </View>

      <FloorNameModal
        editing={Boolean(controller.floorForm?.id)}
        isPending={controller.pending.floorForm}
        onChange={actions.setFloorFormValue}
        onClose={actions.closeFloorForm}
        onSubmit={actions.submitFloorForm}
        value={controller.floorForm?.value ?? ""}
        visible={Boolean(controller.floorForm)}
      />
      <AreaNameModal
        editing={Boolean(controller.areaForm?.id)}
        isPending={controller.pending.areaForm}
        onChange={actions.setAreaFormValue}
        onClose={actions.closeAreaForm}
        onSubmit={actions.submitAreaForm}
        value={controller.areaForm?.value ?? ""}
        visible={Boolean(controller.areaForm)}
      />
      <RoomBatchModal
        area={roomBatch.area}
        assignedRooms={roomBatch.assignedRooms}
        count={roomBatch.count}
        floor={roomBatch.floor}
        isBusy={controller.isBusy}
        isCreating={roomBatch.isCreating}
        onChangeCount={roomBatch.setCount}
        onChangePrefix={roomBatch.setPrefix}
        onChangeStart={roomBatch.setStart}
        onClose={roomBatch.close}
        onDeleteRoom={actions.openRoomDelete}
        onGenerate={roomBatch.generate}
        onUnassignRoom={roomBatch.unassign}
        prefix={roomBatch.prefix}
        start={roomBatch.start}
      />
      <ConfirmationModal
        confirmLabel="Delete"
        description={deleteDescription(controller.deleteTarget)}
        isPending={controller.pending.delete}
        onCancel={() => actions.setDeleteTarget(null)}
        onConfirm={actions.confirmDelete}
        title={deleteTitle(controller.deleteTarget)}
        visible={Boolean(controller.deleteTarget)}
      />
    </Screen>
  );
}
