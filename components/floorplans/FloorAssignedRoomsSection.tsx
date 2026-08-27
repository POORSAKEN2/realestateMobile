import { View } from "react-native";

import { FloorAssignedRoomActionsSheet } from "./FloorAssignedRoomActionsSheet";
import { FloorAssignedRoomsList } from "./FloorAssignedRoomsList";
import { FloorAssignedRoomsToolbar } from "./FloorAssignedRoomsToolbar";
import { useAssignedRoomsViewModel } from "../../hooks/floorplans/useAssignedRoomsViewModel";
import type { PropertyRoom, PropertyRoomStatus } from "../../types";

export function FloorAssignedRoomsSection({
  isBusy,
  onManageBedspaces,
  onStatusChange,
  onUnassign,
  rooms,
}: {
  isBusy: boolean;
  onManageBedspaces: (room: PropertyRoom) => void;
  onStatusChange: (room: PropertyRoom, status: PropertyRoomStatus) => void;
  onUnassign: (room: PropertyRoom) => void;
  rooms: PropertyRoom[];
}) {
  const viewModel = useAssignedRoomsViewModel(rooms);

  return (
    <View>
      {rooms.length ? (
        <FloorAssignedRoomsToolbar
          filteredCount={viewModel.filteredRooms.length}
          onChangeSearch={viewModel.setSearchQuery}
          onChangeStatus={viewModel.setStatusFilter}
          searchQuery={viewModel.searchQuery}
          statusFilter={viewModel.statusFilter}
          totalCount={rooms.length}
        />
      ) : null}

      <View className="mt-4">
        <FloorAssignedRoomsList
          filteredRooms={viewModel.filteredRooms}
          hasActiveFilters={viewModel.hasFilters}
          isBusy={isBusy}
          onClearFilters={viewModel.clearFilters}
          onManageBedspaces={onManageBedspaces}
          onOpenActions={viewModel.openActions}
          totalCount={rooms.length}
        />
      </View>

      <FloorAssignedRoomActionsSheet
        isBusy={isBusy}
        onClose={viewModel.closeActions}
        onManageBedspaces={onManageBedspaces}
        onShowStatus={viewModel.showStatusActions}
        onStatusChange={onStatusChange}
        onUnlink={onUnassign}
        room={viewModel.actionRoom}
        view={viewModel.actionView}
      />
    </View>
  );
}
