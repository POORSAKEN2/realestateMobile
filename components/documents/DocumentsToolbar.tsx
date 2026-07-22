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
      <View className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
        <MaterialCommunityIcons name="magnify" color="#64748B" size={22} />
        <TextInput
          accessibilityLabel="Search documents, properties, or tenants"
          className="min-w-0 flex-1 py-3 font-soraMedium text-sm text-slate-950"
          onChangeText={onChangeSearch}
          placeholder="Search documents, properties, tenants"
          placeholderTextColor="#94A3B8"
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
            <MaterialCommunityIcons name="close" color="#64748B" size={20} />
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
                      ? "border-slate-950 bg-slate-950"
                      : "border-slate-200 bg-white"
                  }`}
                  onPress={() => onChangeCategory(option)}
                >
                  <Text
                    className={`font-soraSemiBold text-xs ${
                      isSelected ? "text-white" : "text-slate-700"
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
          className="relative h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
          onPress={onOpenFilters}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            color="#334155"
            size={20}
          />
          {activeFilterCount ? (
            <View className="absolute -right-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1">
              <Text className="font-soraBold text-[10px] text-white">
                {activeFilterCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        <Text
          accessibilityLiveRegion="polite"
          className="font-soraMedium text-sm text-slate-500"
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
          <Text className="font-soraSemiBold text-sm text-slate-800">
            {sortLabel}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            color="#475569"
            size={20}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
