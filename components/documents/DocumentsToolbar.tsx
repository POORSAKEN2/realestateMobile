import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
      <View className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-secondary/20 bg-white px-4">
        <MaterialCommunityIcons name="magnify" color="#634CE4" size={22} />
        <TextInput
          accessibilityLabel="Search documents, properties, or tenants"
          className="min-w-0 flex-1 py-3 font-ralewaySemiBold text-sm text-textPrimary"
          onChangeText={onChangeSearch}
          placeholder="Search documents, properties, tenants"
          placeholderTextColor="#6F6D6D"
          returnKeyType="search"
          value={searchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            accessibilityLabel="Clear document search"
            accessibilityRole="button"
            activeOpacity={0.75}
            className="h-11 w-11 items-center justify-center rounded-full"
            hitSlop={4}
            onPress={() => onChangeSearch("")}
          >
            <MaterialCommunityIcons name="close" color="#6F6D6D" size={20} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex-row items-center gap-2">
        <ScrollView
          className="min-w-0 flex-1"
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
                      ? "border-primary bg-primary"
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

        <TouchableOpacity
          accessibilityLabel={
            activeFilterCount
              ? `More filters, ${activeFilterCount} active`
              : "More document filters"
          }
          accessibilityRole="button"
          activeOpacity={0.82}
          className="relative h-11 w-11 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10"
          onPress={onOpenFilters}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            color="#634CE4"
            size={20}
          />
          {activeFilterCount ? (
            <View className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
              <Text className="font-ralewayExtraBold text-[10px] text-white">
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <Text
          accessibilityLiveRegion="polite"
          className="font-ralewaySemiBold text-sm text-description"
        >
          {resultCount} {resultCount === 1 ? "document" : "documents"}
        </Text>
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
      </View>
    </View>
  );
}
