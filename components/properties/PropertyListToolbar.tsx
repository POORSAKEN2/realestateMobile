import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { SearchField } from "../ui/fields/SearchField";
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
    <View className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
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
            hasActiveFilter ? "bg-primary" : "bg-secondary/20"
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

      <Modal
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
        transparent
        visible={isFilterVisible}
      >
        <View className="flex-1 justify-end bg-black/35">
          <TouchableOpacity
            accessibilityLabel="Close property filters"
            accessibilityRole="button"
            activeOpacity={1}
            className="flex-1"
            onPress={() => setIsFilterVisible(false)}
          />
          <View className="rounded-t-[28px] bg-white px-5 pb-9 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
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
                className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
                onPress={() => setIsFilterVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#1E1F45"
                  size={21}
                />
              </TouchableOpacity>
            </View>

            <View className="gap-2">
              {statusFilterChoices.map((choice) => {
                const selected = choice.value === statusFilter;

                return (
                  <TouchableOpacity
                    key={choice.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    activeOpacity={0.8}
                    className={`min-h-14 flex-row items-center justify-between rounded-2xl border px-4 ${
                      selected
                        ? "border-primary bg-secondary/20"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() => {
                      onChangeStatus(choice.value);
                      setIsFilterVisible(false);
                    }}
                  >
                    <Text
                      className={`font-ralewayBold text-base ${
                        selected ? "text-primary" : "text-textPrimary"
                      }`}
                    >
                      {choice.label}
                    </Text>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        color="#634CE4"
                        size={21}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
