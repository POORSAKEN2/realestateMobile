import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { ModuleLoadingState } from "../ui/ModuleState";

export function InquiryListState({
  isError,
  isFiltered,
  isLoading,
  onClearFilters,
  onRetry,
}: {
  isError: boolean;
  isFiltered: boolean;
  isLoading: boolean;
  onClearFilters: () => void;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <ModuleLoadingState
        description="Loading guest messages and listing context."
        title="Loading inquiries"
      />
    );
  }

  const error = isError;
  return (
    <View className="items-center rounded-[28px] border border-dashed border-primary/20 bg-white p-8">
      <Ionicons
        name={error ? "cloud-offline-outline" : "mail-unread-outline"}
        size={40}
        color={colors.description}
      />
      <Text className="mt-3 text-center font-ralewayExtraBold text-base text-textPrimary">
        {error
          ? "Inquiries unavailable"
          : isFiltered
            ? "No matching inquiries"
            : "No inquiries yet"}
      </Text>
      <Text className="mt-1 text-center font-ralewayMedium text-sm leading-5 text-description">
        {error
          ? "Check your connection and try again."
          : isFiltered
            ? "Try another search or clear active filters."
            : "Guest messages from public property listings will appear here."}
      </Text>
      {error || isFiltered ? (
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.8}
          className="mt-5 rounded-2xl bg-primary px-5 py-3"
          onPress={error ? onRetry : onClearFilters}
        >
          <Text className="font-ralewayExtraBold text-sm text-white">
            {error ? "Try again" : "Clear filters"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
