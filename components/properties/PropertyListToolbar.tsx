import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";

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
        <View className="h-12 min-w-0 flex-1 flex-row items-center rounded-2xl bg-slate-100 px-3.5">
          <MaterialCommunityIcons name="magnify" color="#475569" size={20} />
          <TextInput
            accessibilityLabel="Search properties by name or location"
            className="ml-2 min-w-0 flex-1 text-base text-[#1d1d1f]"
            onChangeText={onChangeSearch}
            placeholder="Search name or location"
            placeholderTextColor="#64748B"
            returnKeyType="search"
            value={searchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              accessibilityLabel="Clear property search"
              accessibilityRole="button"
              activeOpacity={0.75}
              className="h-11 w-11 items-center justify-center"
              onPress={() => onChangeSearch("")}
            >
              <MaterialCommunityIcons
                name="close-circle"
                color="#64748B"
                size={19}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          accessibilityLabel={`Filter properties, ${getFilterLabel(statusFilter)}`}
          accessibilityRole="button"
          activeOpacity={0.8}
          className={`h-12 min-w-12 flex-row items-center justify-center gap-2 rounded-2xl px-3.5 ${
            hasActiveFilter ? "bg-[#2563EB]" : "bg-[#2563EB]/10"
          }`}
          onPress={() => setIsFilterVisible(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            color={hasActiveFilter ? "#FFFFFF" : "#2563EB"}
            size={20}
          />
          {hasActiveFilter ? (
            <View className="h-2 w-2 rounded-full bg-white" />
          ) : null}
        </TouchableOpacity>
      </View>

      <View className="mt-3 flex-row items-center justify-between px-1">
        <Text className="text-xs font-semibold text-slate-600">
          {resultLabel}
        </Text>
        <Text className="ml-4 flex-1 text-right text-xs font-medium text-slate-600">
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
                <Text className="font-soraSemiBold text-xl text-[#1d1d1f]">
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
                  color="#1D1D1F"
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
                        ? "border-[#2563EB] bg-[#2563EB]/10"
                        : "border-slate-200 bg-white"
                    }`}
                    onPress={() => {
                      onChangeStatus(choice.value);
                      setIsFilterVisible(false);
                    }}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selected ? "text-[#2563EB]" : "text-[#1d1d1f]"
                      }`}
                    >
                      {choice.label}
                    </Text>
                    {selected ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        color="#2563EB"
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
