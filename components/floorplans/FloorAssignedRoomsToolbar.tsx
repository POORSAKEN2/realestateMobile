import { useState } from "react";

import { SingleChoiceFilterSheet } from "../ui/SearchFilterSheet";
import { formatSearchResultLabel, SearchToolbar } from "../ui/SearchToolbar";
import {
  ROOM_STATUS_FILTER_OPTIONS,
  type RoomStatusFilter,
} from "../../utils/floorplans/floorPlanPresentation";

export function FloorAssignedRoomsToolbar({
  filteredCount,
  onChangeSearch,
  onChangeStatus,
  searchQuery,
  statusFilter,
  totalCount,
}: {
  filteredCount: number;
  onChangeSearch: (value: string) => void;
  onChangeStatus: (value: RoomStatusFilter) => void;
  searchQuery: string;
  statusFilter: RoomStatusFilter;
  totalCount: number;
}) {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const statusLabel =
    ROOM_STATUS_FILTER_OPTIONS.find((option) => option.value === statusFilter)
      ?.label ?? "All";

  return (
    <>
      <SearchToolbar
        accessibilityLabel="Search assigned rooms by room number"
        activeFilterCount={statusFilter === "ALL" ? 0 : 1}
        clearAccessibilityLabel="Clear room search"
        filterAccessibilityLabel={`Filter assigned rooms, ${statusLabel}`}
        filterLabel={
          statusFilter === "ALL" ? "All statuses" : `${statusLabel} status`
        }
        onChangeText={onChangeSearch}
        onFilterPress={() => setIsFilterVisible(true)}
        placeholder="Search room number"
        resultLabel={formatSearchResultLabel({
          filteredCount,
          singular: "room",
          totalCount,
        })}
        value={searchQuery}
      />

      <SingleChoiceFilterSheet
        description="Choose one room status."
        onChange={onChangeStatus}
        onClose={() => setIsFilterVisible(false)}
        options={ROOM_STATUS_FILTER_OPTIONS}
        title="Filter assigned rooms"
        value={statusFilter}
        visible={isFilterVisible}
      />
    </>
  );
}
