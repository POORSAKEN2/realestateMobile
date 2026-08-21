import { useState } from "react";

import { SingleChoiceFilterSheet } from "../ui/SearchFilterSheet";
import { SearchToolbar } from "../ui/SearchToolbar";
import {
  formatStatus,
  statusFilterChoices,
  type StatusFilter,
} from "../../utils/properties/propertyForm";

function getFilterLabel(value: StatusFilter) {
  return value === "ALL" ? "All statuses" : formatStatus(value);
}

export function PropertyListToolbar({
  onChangeSearch,
  onChangeStatus,
  resultLabel,
  searchQuery,
  statusFilter,
}: {
  onChangeSearch: (value: string) => void;
  onChangeStatus: (value: StatusFilter) => void;
  resultLabel: string;
  searchQuery: string;
  statusFilter: StatusFilter;
}) {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const hasActiveFilter = statusFilter !== "ALL";

  return (
    <>
      <SearchToolbar
        accessibilityLabel="Search properties by name or location"
        clearAccessibilityLabel="Clear property search"
        filterAccessibilityLabel={`Filter properties, ${getFilterLabel(statusFilter)}`}
        filterLabel={getFilterLabel(statusFilter)}
        hasActiveFilters={hasActiveFilter}
        onChangeText={onChangeSearch}
        onFilterPress={() => setIsFilterVisible(true)}
        placeholder="Search name or location"
        resultLabel={resultLabel}
        value={searchQuery}
      />

      <SingleChoiceFilterSheet
        description="Choose one portfolio status."
        onClose={() => setIsFilterVisible(false)}
        onChange={onChangeStatus}
        options={statusFilterChoices}
        title="Filter properties"
        value={statusFilter}
        visible={isFilterVisible}
      />
    </>
  );
}
