import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { SearchField } from "./fields/SearchField";

type SearchToolbarProps = {
  accessibilityLabel: string;
  activeFilterCount?: number;
  className?: string;
  clearAccessibilityLabel: string;
  filterAccessibilityLabel?: string;
  filterLabel?: string;
  footerAccessory?: ReactNode;
  hasActiveFilters?: boolean;
  onChangeText: (value: string) => void;
  onFilterPress?: () => void;
  placeholder: string;
  resultLabel?: string;
  value: string;
  variant?: "compact" | "standard";
};

export function formatSearchResultLabel({
  filteredCount,
  isLoading = false,
  singular,
  totalCount,
}: {
  filteredCount: number;
  isLoading?: boolean;
  singular: string;
  totalCount: number;
}) {
  const noun = totalCount === 1 ? singular : `${singular}s`;

  if (isLoading) return `Loading ${singular}s`;
  if (filteredCount === totalCount) return `${totalCount} ${noun}`;
  return `${filteredCount} of ${totalCount} ${noun}`;
}

function FilterButton({
  accessibilityLabel,
  activeFilterCount = 0,
  compact,
  hasActiveFilters,
  onPress,
}: {
  accessibilityLabel: string;
  activeFilterCount?: number;
  compact: boolean;
  hasActiveFilters: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.8}
      className={`relative h-12 min-w-12 items-center justify-center rounded-2xl ${
        compact ? "" : hasActiveFilters ? "bg-primary" : "bg-primary/10"
      }`}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name="tune-variant"
        color={!compact && hasActiveFilters ? "#FFFFFF" : "#8A77F4"}
        size={21}
      />

      {activeFilterCount > 0 ? (
        <View className="absolute right-0 top-0 h-5 min-w-5 items-center justify-center rounded-full bg-white px-1">
          <Text className="font-ralewayExtraBold text-[10px] text-primary">
            {activeFilterCount}
          </Text>
        </View>
      ) : hasActiveFilters ? (
        <View
          className={`absolute right-1 top-1 h-2 w-2 rounded-full ${
            compact ? "bg-primary" : "bg-white"
          }`}
        />
      ) : null}
    </TouchableOpacity>
  );
}

export function SearchToolbar({
  accessibilityLabel,
  activeFilterCount = 0,
  className = "",
  clearAccessibilityLabel,
  filterAccessibilityLabel = "Open filters",
  filterLabel,
  footerAccessory,
  hasActiveFilters = false,
  onChangeText,
  onFilterPress,
  placeholder,
  resultLabel,
  value,
  variant = "standard",
}: SearchToolbarProps) {
  const filtersActive = hasActiveFilters || activeFilterCount > 0;
  const filterButton = onFilterPress ? (
    <FilterButton
      accessibilityLabel={filterAccessibilityLabel}
      activeFilterCount={activeFilterCount}
      compact={variant === "compact"}
      hasActiveFilters={filtersActive}
      onPress={onFilterPress}
    />
  ) : null;

  if (variant === "compact") {
    return (
      <SearchField
        accessibilityLabel={accessibilityLabel}
        clearAccessibilityLabel={clearAccessibilityLabel}
        endAccessory={filterButton}
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
        variant="outlined"
        wrapperClassName={`h-14 rounded-[22px] ${className}`}
      />
    );
  }

  const hasFooter = Boolean(resultLabel || filterLabel || footerAccessory);

  return (
    <View
      className={`rounded-3xl border border-primary/20 bg-white p-3 shadow-sm shadow-primary/10 ${className}`}
    >
      <View className="flex-row gap-2">
        <SearchField
          accessibilityLabel={accessibilityLabel}
          clearAccessibilityLabel={clearAccessibilityLabel}
          onChangeText={onChangeText}
          placeholder={placeholder}
          value={value}
          wrapperClassName="flex-1"
        />
        {filterButton}
      </View>

      {hasFooter ? (
        <View className="mt-3 flex-row items-center justify-between gap-4 px-1">
          {resultLabel ? (
            <Text
              accessibilityLiveRegion="polite"
              className="min-w-0 flex-1 font-ralewayBold text-xs text-description"
              numberOfLines={1}
            >
              {resultLabel}
            </Text>
          ) : (
            <View className="flex-1" />
          )}
          {footerAccessory ??
            (filterLabel ? (
              <Text
                className="min-w-0 flex-1 text-right font-ralewaySemiBold text-xs text-description"
                numberOfLines={1}
              >
                {filterLabel}
              </Text>
            ) : null)}
        </View>
      ) : null}
    </View>
  );
}
