import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  type AssetSortBy,
  type AssetSortOrder,
  type AssetStatusFilter,
} from "../../utils/dashboard/dashboardHelpers";
import { statusFilterChoices } from "../../utils/properties/propertyForm";
import {
  RadioOptionList,
  type RadioOption,
} from "../ui/groups/RadioOptionList";
import {
  SearchFilterActions,
  SearchFilterSection,
  SearchFilterSheet,
} from "../ui/SearchFilterSheet";

export type PortfolioAssetFilters = {
  sortBy: AssetSortBy;
  sortOrder: AssetSortOrder;
  status: AssetStatusFilter;
};

const DEFAULT_FILTERS: PortfolioAssetFilters = {
  sortBy: "value",
  sortOrder: "desc",
  status: "ALL",
};

const sortFieldOptions: RadioOption<AssetSortBy>[] = [
  { label: "Value", value: "value" },
  { label: "ROI", value: "roi" },
  { label: "Name", value: "name" },
];

const sortOrderOptions: RadioOption<AssetSortOrder>[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

export function PortfolioAssetFilterSheet({
  filters,
  onApply,
  onClose,
  visible,
}: {
  filters: PortfolioAssetFilters;
  onApply: (filters: PortfolioAssetFilters) => void;
  onClose: () => void;
  visible: boolean;
}) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters.sortBy, filters.sortOrder, filters.status, visible]);

  return (
    <SearchFilterSheet
      description="Choose a status, sort field, and direction."
      footer={
        <SearchFilterActions
          onApply={() => onApply(draft)}
          onReset={() => setDraft(DEFAULT_FILTERS)}
        />
      }
      onClose={onClose}
      title="Filter portfolio assets"
      visible={visible}
    >
      <SearchFilterSection label="Status">
        <RadioOptionList
          onSelect={(status) => setDraft((current) => ({ ...current, status }))}
          options={statusFilterChoices}
          value={draft.status}
        />
      </SearchFilterSection>

      <View className="border-t border-secondary/20 pt-5">
        <SearchFilterSection label="Sort field">
          <RadioOptionList
            onSelect={(sortBy) =>
              setDraft((current) => ({ ...current, sortBy }))
            }
            options={sortFieldOptions}
            value={draft.sortBy}
          />
        </SearchFilterSection>
      </View>

      <View className="border-t border-secondary/20 pt-5">
        <SearchFilterSection label="Sort by">
          <RadioOptionList
            onSelect={(sortOrder) =>
              setDraft((current) => ({ ...current, sortOrder }))
            }
            options={sortOrderOptions}
            value={draft.sortOrder}
          />
        </SearchFilterSection>
      </View>
    </SearchFilterSheet>
  );
}
