import { Feather, Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors } from "../../constants/colors";
import type { InquiryStatusFilter } from "../../types/domain/inquiries";
import { INQUIRY_STATUS_OPTIONS } from "../../utils/inquiries/inquiryDomain";

const FILTERS: ReadonlyArray<{ label: string; value: InquiryStatusFilter }> = [
  { label: "All", value: "all" },
  ...INQUIRY_STATUS_OPTIONS,
];

export function InquiryFilters({
  onQueryChange,
  onStatusChange,
  query,
  status,
}: {
  onQueryChange: (value: string) => void;
  onStatusChange: (value: InquiryStatusFilter) => void;
  query: string;
  status: InquiryStatusFilter;
}) {
  return (
    <View className="gap-3">
      <View className="h-12 flex-row items-center rounded-2xl border border-primary/20 bg-white px-3.5 shadow-sm shadow-primary/5">
        <Feather name="search" size={16} color={colors.description} />
        <TextInput
          accessibilityLabel="Search inquiries"
          autoCapitalize="none"
          className="ml-2.5 flex-1 font-ralewayMedium text-sm text-textPrimary"
          onChangeText={onQueryChange}
          placeholder="Guest, contact, property, or message"
          placeholderTextColor={colors.description}
          returnKeyType="search"
          value={query}
        />
        {query ? (
          <TouchableOpacity
            accessibilityLabel="Clear inquiry search"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onQueryChange("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.description}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="gap-2 pr-2"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {FILTERS.map((option) => {
          const selected = status === option.value;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected }}
              activeOpacity={0.8}
              className={`rounded-full border px-4 py-2 ${
                selected
                  ? "border-primary bg-primary"
                  : "border-primary/15 bg-white"
              }`}
              key={option.value}
              onPress={() => onStatusChange(option.value)}
            >
              <Text
                className={`font-ralewayBold text-xs ${selected ? "text-white" : "text-description"}`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
