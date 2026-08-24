import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

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
import { appRoutes } from "../../constants/navigation";
import { useFloorPlanManagerController } from "../../hooks/floorplans/useFloorPlanManagerController";
import { useProperties } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";
import { deviceFloorPlanDependencies } from "../../services/floorplans/deviceFloorPlanServices";
import {
  getFloorManagerGuidance,
  getRoomManagementGuidance,
  isPropertyType,
  resolveFloorManagerPolicy,
} from "../../utils/properties/floorManagerPolicy";

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
  return "";
}

function deleteTitle(
  target: ReturnType<typeof useFloorPlanManagerController>["deleteTarget"],
) {
  return target?.kind === "floor" ? "Delete floor?" : "Delete area?";
}

export default function FloorPlansScreen() {
  const params = useLocalSearchParams<{
    propertyId?: string | string[];
    propertyTitle?: string | string[];
    propertyType?: string | string[];
  }>();
  const propertyId = firstParam(params.propertyId);
  const propertyTypeParam = firstParam(params.propertyType);
  const fallbackPropertyType = isPropertyType(propertyTypeParam)
    ? propertyTypeParam
    : undefined;
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const { useDetail } = useProperties(accessToken);
  const propertyQuery = useDetail(propertyId);
  const property = propertyQuery.data;
  const basePolicy = resolveFloorManagerPolicy({
    backendCapabilities: property?.spatialCapabilities,
    propertyType: property?.type ?? fallbackPropertyType,
  });
  const controller = useFloorPlanManagerController({
    accessToken,
    dependencies: deviceFloorPlanDependencies,
    floorPlanCapability: basePolicy.floorPlans,
    propertyId,
    roomCapability: basePolicy.rooms,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!propertyId) {
    return (
      <Screen className="bg-[#F5F7FC]">
        <MissingPropertyState onBack={() => router.back()} />
      </Screen>
    );
  }

  const { actions, roomBatch } = controller;
  const policy = resolveFloorManagerPolicy({
    backendCapabilities: property?.spatialCapabilities,
    hasFloorPlans: controller.floorPlans.length > 0,
    hasRooms: controller.rooms.length > 0,
    propertyType: property?.type ?? fallbackPropertyType,
  });
  const propertyTitle =
    property?.title || firstParam(params.propertyTitle) || "Property";
  const isLoading =
    controller.queries.floorPlans.isLoading ||
    controller.queries.rooms.isLoading;
  const isError =
    controller.queries.floorPlans.isError || controller.queries.rooms.isError;

  async function refreshFloorPlans() {
    setIsRefreshing(true);
    try {
      await Promise.all([
        propertyQuery.refetch(),
        controller.queries.floorPlans.refetch(),
        controller.queries.rooms.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Screen className="bg-[#F5F7FC]">
      <View className="flex-1">
        <FloorPlanManagerHeader
          canAddFloor={policy.canCreateFloorPlans}
          floorCount={controller.floorPlans.length}
          guidance={getFloorManagerGuidance(policy)}
          notice={controller.notice}
          onAddFloor={actions.openFloorCreate}
          onBack={() => router.back()}
          onClearNotice={actions.clearNotice}
          propertyTitle={propertyTitle}
          roomCount={controller.rooms.length}
          showRoomSummary={policy.showRoomActions}
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
          <ScrollView
            className="-mx-6 flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
            refreshControl={
              <RefreshControl
                colors={["#8A77F4"]}
                onRefresh={refreshFloorPlans}
                refreshing={isRefreshing}
                tintColor="#8A77F4"
              />
            }
          >
            <EmptyFloorPlanState
              canCreate={policy.canCreateFloorPlans}
              mode={policy.mode}
              onCreate={actions.openFloorCreate}
            />
          </ScrollView>
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
            onRefresh={refreshFloorPlans}
            onSaveShape={actions.saveShape}
            onSelectFloor={actions.selectFloor}
            onToggleAreaVisibility={controller.visibility.toggle}
            roomGuidance={getRoomManagementGuidance(policy)}
            rooms={controller.rooms}
            showRoomActions={policy.showRoomActions}
            refreshing={isRefreshing}
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
        assignedRoomCount={roomBatch.assignedRooms.length}
        availableRooms={roomBatch.availableRooms}
        canCreateRooms={roomBatch.canCreateRooms}
        canGenerate={roomBatch.canGenerate}
        count={roomBatch.count}
        floor={roomBatch.floor}
        isBusy={controller.isBusy}
        isCreating={roomBatch.isCreating}
        isLinking={roomBatch.isLinking}
        onChangeCount={roomBatch.setCount}
        onChangePrefix={roomBatch.setPrefix}
        onChangeStart={roomBatch.setStart}
        onClose={roomBatch.close}
        onGenerate={roomBatch.generate}
        onLinkRoom={roomBatch.linkSelectedRoom}
        onOpenAssignedRooms={() => {
          if (!roomBatch.area || !roomBatch.floor) return;

          const area = roomBatch.area;
          const floor = roomBatch.floor;
          roomBatch.close();
          router.push({
            pathname: appRoutes.secondary.assignedRooms,
            params: {
              areaId: area.id,
              areaLabel: area.label,
              floorName: floor.name,
              propertyId,
              propertyTitle,
            },
          });
        }}
        onSelectRoom={roomBatch.setSelectedRoomId}
        onSnackbarDismiss={roomBatch.batchSnackbar.dismiss}
        prefix={roomBatch.prefix}
        start={roomBatch.start}
        selectedRoomId={roomBatch.selectedRoomId}
        snackbarMessage={roomBatch.batchSnackbar.message}
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
