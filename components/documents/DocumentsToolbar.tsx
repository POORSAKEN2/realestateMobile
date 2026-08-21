import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { SearchToolbar } from "../ui/SearchToolbar";
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategoryFilter,
} from "../../utils/documents/documentPresentation";

export function DocumentsToolbar({
  activeFilterCount,
  category,
  onChangeCategory,
  onChangeSearch,
  onOpenFilters,
  onOpenSort,
  resultCount,
  searchQuery,
  sortLabel,
}: {
  activeFilterCount: number;
  category: DocumentCategoryFilter;
  onChangeCategory: (category: DocumentCategoryFilter) => void;
  onChangeSearch: (query: string) => void;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  resultCount: number;
  searchQuery: string;
  sortLabel: string;
}) {
  return (
    <View className="gap-4">
      <SearchToolbar
        accessibilityLabel="Search documents, properties, or tenants"
        activeFilterCount={activeFilterCount}
        clearAccessibilityLabel="Clear document search"
        filterAccessibilityLabel={
          activeFilterCount
            ? `More document filters, ${activeFilterCount} active`
            : "More document filters"
        }
        footerAccessory={
          <TouchableOpacity
            accessibilityLabel={`Sort documents, currently ${sortLabel}`}
            accessibilityRole="button"
            activeOpacity={0.8}
            className="min-h-11 flex-row items-center gap-1 rounded-xl px-2"
            onPress={onOpenSort}
          >
            <Text className="font-ralewayBold text-sm text-textPrimary">
              {sortLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              color="#634CE4"
              size={20}
            />
          </TouchableOpacity>
        }
        onChangeText={onChangeSearch}
        onFilterPress={onOpenFilters}
        placeholder="Search documents, properties, tenants"
        resultLabel={`${resultCount} ${resultCount === 1 ? "document" : "documents"}`}
        value={searchQuery}
      />

      <ScrollView
        contentContainerStyle={{ gap: 8 }}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {(["All", ...DOCUMENT_CATEGORIES] as DocumentCategoryFilter[]).map(
          (option) => {
            const isSelected = category === option;

            return (
              <TouchableOpacity
                key={option}
                accessibilityLabel={`Filter by ${option}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.82}
                className={`min-h-11 justify-center rounded-2xl border px-4 ${
                  isSelected
                    ? "border-secondary bg-secondary"
                    : "border-secondary/20 bg-white"
                }`}
                onPress={() => onChangeCategory(option)}
              >
                <Text
                  className={`font-ralewayBold text-xs ${
                    isSelected ? "text-white" : "text-textPrimary"
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          },
        )}
      </ScrollView>
    </View>
  );
}
