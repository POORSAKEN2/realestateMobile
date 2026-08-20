import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import {
  type AssetSortBy,
  type AssetSortOrder,
  type AssetStatusFilter,
} from "../../utils/dashboard/dashboardHelpers";
import { statusFilterChoices } from "../../utils/properties/propertyForm";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import {
  RadioOptionList,
  type RadioOption,
} from "../ui/groups/RadioOptionList";

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
    <BottomSheetModal
      backdropAccessibilityLabel="Close portfolio asset filters"
      backdropClassName="bg-textPrimary/45"
      onClose={onClose}
      visible={visible}
    >
      <View className="max-h-[90%] rounded-t-[30px] bg-white">
        <View className="pt-3">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-secondary/30" />
        </View>

        <View className="flex-row items-center justify-between border-b border-secondary/20 px-5 pb-4">
          <View className="min-w-0 flex-1 pr-4">
            <Text className="font-ralewayExtraBold text-xl text-textPrimary">
              Filter portfolio assets
            </Text>
            <Text className="mt-1 text-sm text-slate-600">
              Choose a status, sort field, and direction.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Close portfolio asset filters"
            accessibilityRole="button"
            activeOpacity={0.8}
            className="h-11 w-11 items-center justify-center rounded-full bg-secondary/10"
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" color="#634CE4" size={21} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="shrink"
          contentContainerClassName="gap-5 px-5 pb-4 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
              Status
            </Text>
            <RadioOptionList
              onSelect={(status) =>
                setDraft((current) => ({ ...current, status }))
              }
              options={statusFilterChoices}
              value={draft.status}
            />
          </View>

          <View className="gap-3 border-t border-secondary/20 pt-5">
            <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
              Sort field
            </Text>
            <RadioOptionList
              onSelect={(sortBy) =>
                setDraft((current) => ({ ...current, sortBy }))
              }
              options={sortFieldOptions}
              value={draft.sortBy}
            />
          </View>

          <View className="gap-3 border-t border-secondary/20 pt-5">
            <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
              Sort by
            </Text>
            <RadioOptionList
              onSelect={(sortOrder) =>
                setDraft((current) => ({ ...current, sortOrder }))
              }
              options={sortOrderOptions}
              value={draft.sortOrder}
            />
          </View>
        </ScrollView>

        <View className="flex-row gap-3 border-t border-secondary/20 px-4 pt-4">
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-secondary/10"
            onPress={() => setDraft(DEFAULT_FILTERS)}
          >
            <Text className="font-ralewayExtraBold text-sm text-textPrimary">
              Reset
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            className="min-h-12 flex-[2] items-center justify-center rounded-2xl bg-secondary"
            onPress={() => onApply(draft)}
          >
            <Text className="font-ralewayExtraBold text-sm text-white">
              Apply filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}
