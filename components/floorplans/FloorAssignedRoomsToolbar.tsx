import { Text, View } from "react-native";

import ChoiceChips from "../ui/chips/ChoiceChips";
import { SearchField } from "../ui/fields/SearchField";
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
  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-3">
      <SearchField
        accessibilityLabel="Search assigned rooms by room number"
        clearAccessibilityLabel="Clear room search"
        onChangeText={onChangeSearch}
        placeholder="Search room number"
        value={searchQuery}
      />

      <View className="mt-3 flex-row items-center justify-between px-1">
        <Text className="font-ralewayBold text-xs text-slate-600">
          Filter by status
        </Text>
        <Text className="font-ralewaySemiBold text-xs text-slate-500">
          {filteredCount} of {totalCount}
        </Text>
      </View>
      <ChoiceChips
        activeClassName="border-primary bg-secondary/10"
        activeTextClassName="text-primary"
        className="mt-2 flex-row flex-wrap gap-2"
        onSelect={onChangeStatus}
        options={ROOM_STATUS_FILTER_OPTIONS}
        value={statusFilter}
      />
    </View>
  );
}
