import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { BottomSheetModal } from "../ui/BottomSheetModal";
import { SearchField } from "../ui/fields/SearchField";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
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
    <View className="rounded-3xl border border-secondary/20 bg-white p-3 shadow-sm shadow-secondary/10">
      <View className="flex-row gap-2">
        <SearchField
          accessibilityLabel="Search properties by name or location"
          clearAccessibilityLabel="Clear property search"
          onChangeText={onChangeSearch}
          placeholder="Search name or location"
          value={searchQuery}
          wrapperClassName="flex-1"
        />

        <TouchableOpacity
          accessibilityLabel={`Filter properties, ${getFilterLabel(statusFilter)}`}
          accessibilityRole="button"
          activeOpacity={0.8}
          className={`h-12 min-w-12 flex-row items-center justify-center gap-2 rounded-2xl px-3.5 ${
            hasActiveFilter ? "bg-secondary" : "bg-secondary/10"
          }`}
          onPress={() => setIsFilterVisible(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            color={hasActiveFilter ? "#FFFFFF" : "#634CE4"}
            size={20}
          />
          {hasActiveFilter ? (
            <View className="h-2 w-2 rounded-full bg-white" />
          ) : null}
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center justify-between px-1">
        <Text className="font-ralewayBold text-xs text-slate-600">
          {resultLabel}
        </Text>
        <Text className="ml-4 flex-1 text-right font-ralewaySemiBold text-xs text-slate-600">
          {getFilterLabel(statusFilter)}
        </Text>
      </View>

      <BottomSheetModal
        backdropAccessibilityLabel="Close property filters"
        backdropClassName="bg-black/35"
        onClose={() => setIsFilterVisible(false)}
        visible={isFilterVisible}
      >
        <View className="max-h-[82%] rounded-t-[30px] bg-white pt-5">
          <View className="mb-4 flex-row items-center justify-between px-5">
            <View>
              <Text className="font-ralewayBold text-xl text-textPrimary">
                Filter properties
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Choose one portfolio status.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close property filters"
              accessibilityRole="button"
              activeOpacity={0.8}
              className="h-11 w-11 items-center justify-center rounded-full bg-secondary/10"
              onPress={() => setIsFilterVisible(false)}
            >
              <MaterialCommunityIcons name="close" color="#634CE4" size={21} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerClassName="px-5 pb-20"
            showsVerticalScrollIndicator={false}
          >
            <RadioOptionList
              onSelect={(status) => {
                onChangeStatus(status);
                setIsFilterVisible(false);
              }}
              options={statusFilterChoices}
              value={statusFilter}
            />
          </ScrollView>
        </View>
      </BottomSheetModal>
    </View>
  );
}
