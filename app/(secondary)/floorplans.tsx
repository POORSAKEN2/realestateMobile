import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

import { FloorPlanManagerHeader } from "../../components/floorplans/FloorPlanManagerHeader";
import { FloorNameModal } from "../../components/floorplans/FloorPlanManagerModals";
import {
  EmptyFloorPlanState,
  FloorPlanErrorState,
  FloorPlanLoadingState,
  MissingPropertyState,
} from "../../components/floorplans/FloorPlanManagerState";
import { FloorPlanWorkspace } from "../../components/floorplans/FloorPlanWorkspace";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { appRoutes } from "../../constants/navigation";
import { useFloorPlanManagerController } from "../../hooks/floorplans/useFloorPlanManagerController";
import { useFloorPlanSnackbar } from "../../hooks/floorplans/useFloorPlanSnackbar";
import { useProperties } from "../../hooks/api/useProperties";
import { useAuth } from "../../hooks/useAuth";
import { deviceFloorPlanDependencies } from "../../services/floorplans/deviceFloorPlanServices";
import {
  getFloorManagerGuidance,
  isPropertyType,
  resolveFloorManagerPolicy,
} from "../../utils/properties/floorManagerPolicy";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function floorDeleteDescription(
  target: ReturnType<typeof useFloorPlanManagerController>["deleteTarget"],
) {
  if (target?.kind === "floor") {
    return `Delete ${target.item.name}? Its areas and plan image will also be removed. Rooms remain in property.`;
  }
  return "";
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
  const floorPlanSnackbar = useFloorPlanSnackbar({
    clearNotice: controller.actions.clearNotice,
    isImageUploading: controller.pending.imageUpload,
    notice: controller.notice,
  });

  if (!propertyId) {
    return (
      <Screen className="bg-surface">
        <MissingPropertyState onBack={() => router.back()} />
      </Screen>
    );
  }

  const { actions } = controller;
  const policy = resolveFloorManagerPolicy({
    backendCapabilities: property?.spatialCapabilities,
    hasFloorPlans: controller.floorPlans.length > 0,
    hasRooms: controller.rooms.length > 0,
    propertyType: property?.type ?? fallbackPropertyType,
  });
  const propertyTitle =
    property?.title || firstParam(params.propertyTitle) || "Property";
  const isLoading =
    propertyQuery.isLoading ||
    controller.queries.floorPlans.isLoading ||
    controller.queries.rooms.isLoading;
  const isError =
    propertyQuery.isError ||
    controller.queries.floorPlans.isError ||
    controller.queries.rooms.isError;

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
    <Screen className="bg-surface">
      <View className="flex-1">
        <FloorPlanManagerHeader
          canAddFloor={policy.canCreateFloorPlans}
          floorCount={controller.floorPlans.length}
          guidance={getFloorManagerGuidance(policy)}
          onAddFloor={actions.openFloorCreate}
          onBack={() => router.back()}
          propertyTitle={propertyTitle}
          roomCount={controller.rooms.length}
          showRoomSummary={policy.showRoomActions}
          totalAreas={controller.totalAreas}
        />

        {isLoading ? (
          <FloorPlanLoadingState />
        ) : isError ? (
          <FloorPlanErrorState onRetry={() => void refreshFloorPlans()} />
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
            floorPlans={controller.floorPlans}
            hiddenAreaIds={controller.visibility.hiddenAreaIds}
            onDeleteFloor={actions.openFloorDelete}
            onManageAreas={(floor) =>
              router.push({
                pathname: appRoutes.secondary.floorAreas,
                params: {
                  floorId: floor.id,
                  floorName: floor.name,
                  propertyId,
                  propertyTitle,
                  propertyType: property?.type ?? fallbackPropertyType,
                },
              })
            }
            onPickImage={actions.pickFloorPlanImage}
            onRenameFloor={actions.openFloorEdit}
            onRefresh={refreshFloorPlans}
            onSelectFloor={actions.selectFloor}
            rooms={controller.rooms}
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
      <ConfirmationModal
        confirmLabel="Delete"
        description={floorDeleteDescription(controller.deleteTarget)}
        isPending={controller.pending.delete}
        onCancel={() => actions.setDeleteTarget(null)}
        onConfirm={actions.confirmDelete}
        title="Delete floor?"
        visible={controller.deleteTarget?.kind === "floor"}
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
