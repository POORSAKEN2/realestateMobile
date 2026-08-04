import { useMemo, useState } from "react";

import type { PropertyRoom } from "../../types";
import {
  filterAssignedRooms,
  type RoomStatusFilter,
} from "../../utils/floorplans/floorPlanPresentation";

export type AssignedRoomActionView = "actions" | "status";

export function useAssignedRoomsViewModel(rooms: PropertyRoom[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatusFilter>("ALL");
  const [actionRoomId, setActionRoomId] = useState("");
  const [actionView, setActionView] = useState<AssignedRoomActionView | null>(
    null,
  );
  const filteredRooms = useMemo(
    () => filterAssignedRooms(rooms, searchQuery, statusFilter),
    [rooms, searchQuery, statusFilter],
  );
  const actionRoom = rooms.find((room) => room.id === actionRoomId);

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
  }

  function openActions(roomId: string) {
    setActionRoomId(roomId);
    setActionView("actions");
  }

  return {
    actionRoom,
    actionView,
    clearFilters,
    closeActions: () => setActionView(null),
    filteredRooms,
    hasFilters: Boolean(searchQuery.trim()) || statusFilter !== "ALL",
    openActions,
    searchQuery,
    setSearchQuery,
    setStatusFilter,
    showStatusActions: () => setActionView("status"),
    statusFilter,
  };
}
