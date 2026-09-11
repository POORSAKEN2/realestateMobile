import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { InquiryStatus } from "../../types/domain/inquiries";
import { INQUIRY_STATUS_OPTIONS } from "../../utils/inquiries/inquiryDomain";

export function InquiryStatusActions({
  canUpdate,
  isUpdating,
  onChange,
  status,
}: {
  canUpdate: boolean;
  isUpdating: boolean;
  onChange: (status: InquiryStatus) => void;
  status: InquiryStatus;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <Text className="font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
          Status
        </Text>
        {!canUpdate ? (
          <Ionicons name="lock-closed" size={12} color={colors.description} />
        ) : null}
        {isUpdating ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : null}
      </View>
      <View className="flex-row gap-2">
        {INQUIRY_STATUS_OPTIONS.map((option) => {
          const selected = option.value === status;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{
                disabled: selected || isUpdating,
                selected,
              }}
              activeOpacity={0.8}
              className={`min-h-10 flex-1 flex-row items-center justify-center gap-1 rounded-xl border px-2 ${
                selected
                  ? "border-primary bg-primary"
                  : "border-primary/20 bg-white"
              }`}
              disabled={selected || isUpdating}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              {!canUpdate && !selected ? (
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color={colors.description}
                />
              ) : null}
              <Text
                className={`font-ralewayBold text-[11px] ${
                  selected ? "text-white" : "text-textPrimary"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
