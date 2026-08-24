import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { FloorAreaManagerHeader } from "../../components/floorplans/FloorAreaManagerHeader";
import { FloorAreaWorkspace } from "../../components/floorplans/FloorAreaWorkspace";
import {
  AreaNameModal,
  RoomBatchModal,
} from "../../components/floorplans/FloorPlanManagerModals";
import {
  FloorAreaLoadingState,
  FloorPlanErrorState,
  MissingFloorState,
  MissingPropertyState,
} from "../../components/floorplans/FloorPlanManagerState";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { appRoutes } from "../../constants/navigation";
import { useProperties } from "../../hooks/api/useProperties";
import { useFloorPlanManagerController } from "../../hooks/floorplans/useFloorPlanManagerController";
import { useFloorPlanSnackbar } from "../../hooks/floorplans/useFloorPlanSnackbar";
import { useAuth } from "../../hooks/useAuth";
import { deviceFloorPlanDependencies } from "../../services/floorplans/deviceFloorPlanServices";
import {
  getRoomManagementGuidance,
  isPropertyType,
  resolveFloorManagerPolicy,
} from "../../utils/properties/floorManagerPolicy";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export default function FloorAreasScreen() {
  const params = useLocalSearchParams<{
    floorId?: string | string[];
    floorName?: string | string[];
    propertyId?: string | string[];
    propertyTitle?: string | string[];
    propertyType?: string | string[];
  }>();
  const floorId = firstParam(params.floorId);
  const fallbackFloorName = firstParam(params.floorName) || "Floor";
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
    initialFloorId: floorId,
    propertyId,
    roomCapability: basePolicy.rooms,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const floorPlanSnackbar = useFloorPlanSnackbar({
    clearNotice: controller.actions.clearNotice,
    isImageUploading: controller.pending.imageUpload,
    notice: controller.notice,
  });

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
  const floorName = controller.activeFloor?.name ?? fallbackFloorName;
  const isLoading =
    propertyQuery.isLoading ||
    controller.queries.floorPlans.isLoading ||
    controller.queries.rooms.isLoading;
  const isError =
    propertyQuery.isError ||
    controller.queries.floorPlans.isError ||
    controller.queries.rooms.isError;

  async function refreshFloorAreas() {
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
        <FloorAreaManagerHeader
          canAddArea={Boolean(controller.activeFloor) && !isLoading && !isError}
          floorName={floorName}
          onAddArea={actions.openAreaCreate}
          onBack={() => router.back()}
          propertyTitle={propertyTitle}
        />

        {isLoading ? (
          <FloorAreaLoadingState />
        ) : isError ? (
          <FloorPlanErrorState
            onRetry={() => void refreshFloorAreas()}
            title="Floor areas unavailable"
          />
        ) : !controller.activeFloor ? (
          <MissingFloorState onBack={() => router.back()} />
        ) : (
          <FloorAreaWorkspace
            activeFloor={controller.activeFloor}
            drawingArea={controller.drawingArea}
            drawingMode={controller.drawing?.mode ?? null}
            floorPlans={controller.floorPlans}
            hiddenAreaIds={controller.visibility.hiddenAreaIds}
            isShapeSaving={controller.pending.shape}
            onCancelDrawing={actions.closeDrawing}
            onDeleteArea={actions.openAreaDelete}
            onDrawArea={actions.openDrawing}
            onManageRooms={roomBatch.open}
            onRefresh={refreshFloorAreas}
            onRenameArea={actions.openAreaEdit}
            onSaveShape={actions.saveShape}
            onSelectFloor={actions.selectFloor}
            onToggleAreaVisibility={controller.visibility.toggle}
            refreshing={isRefreshing}
            roomGuidance={getRoomManagementGuidance(policy)}
            rooms={controller.rooms}
            showRoomActions={policy.showRoomActions}
          />
        )}
      </View>

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
        description={
          controller.deleteTarget?.kind === "area"
            ? `Delete ${controller.deleteTarget.item.label}? Assigned rooms remain but become unassigned.`
            : ""
        }
        isPending={controller.pending.delete}
        onCancel={() => actions.setDeleteTarget(null)}
        onConfirm={actions.confirmDelete}
        title="Delete area?"
        visible={controller.deleteTarget?.kind === "area"}
      />
      <ScreenSnackbar
        icon={floorPlanSnackbar.icon}
        message={floorPlanSnackbar.message}
        onDismiss={floorPlanSnackbar.dismiss}
        placement="above-navigation"
      />
    </Screen>
  );
}
