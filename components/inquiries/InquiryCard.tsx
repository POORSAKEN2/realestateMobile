import { Feather, Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { Inquiry, InquiryStatus } from "../../types/domain/inquiries";
import { formatInquiryDate } from "../../utils/inquiries/inquiryDomain";
import { InquiryStatusActions } from "./InquiryStatusActions";

const STATUS_STYLE = {
  new: { container: "border-info/20 bg-infoSurface", text: "text-info" },
  contacted: {
    container: "border-primary/20 bg-primary/10",
    text: "text-primary",
  },
  declined: {
    container: "border-description/20 bg-description/10",
    text: "text-description",
  },
} as const;

export function InquiryCard({
  canUpdate,
  inquiry,
  isUpdating,
  onOpen,
  onStatusChange,
}: {
  canUpdate: boolean;
  inquiry: Inquiry;
  isUpdating: boolean;
  onOpen: () => void;
  onStatusChange: (status: InquiryStatus) => void;
}) {
  return (
    <View className="mb-3 rounded-[24px] border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5">
      <TouchableOpacity
        accessibilityLabel={`Open inquiry from ${inquiry.guest.name}`}
        accessibilityRole="button"
        activeOpacity={0.78}
        onPress={onOpen}
      >
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent/25">
            <Ionicons
              name="mail-unread-outline"
              size={21}
              color={colors.primary}
            />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start gap-2">
              <Text
                className="min-w-0 flex-1 font-ralewayExtraBold text-base text-textPrimary"
                numberOfLines={1}
              >
                {inquiry.guest.name}
              </Text>
              <View
                className={`rounded-full border px-2.5 py-1 ${STATUS_STYLE[inquiry.status].container}`}
              >
                <Text
                  className={`font-ralewayBold text-[10px] uppercase tracking-wider ${STATUS_STYLE[inquiry.status].text}`}
                >
                  {inquiry.status}
                </Text>
              </View>
            </View>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Feather name="user" size={12} color={colors.description} />
              <Text
                className="font-ralewayMedium text-xs text-description"
                numberOfLines={1}
              >
                {inquiry.guest.contact || "No contact supplied"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-3 gap-1.5 rounded-2xl bg-surface p-3">
          <Text
            className="font-ralewayBold text-xs text-textPrimary"
            numberOfLines={1}
          >
            Listing · {inquiry.listing.title}
          </Text>
          <Text
            className="font-ralewayMedium text-xs text-description"
            numberOfLines={1}
          >
            Property · {inquiry.property.title}
          </Text>
          <Text
            className="mt-1 font-ralewayMedium text-sm leading-5 text-textPrimary"
            numberOfLines={3}
          >
            {inquiry.message || "No message supplied."}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Feather name="clock" size={12} color={colors.description} />
            <Text className="font-ralewayBold text-xs text-description">
              {formatInquiryDate(inquiry.createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="font-ralewayBold text-xs text-primary">
              Details
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>

      <View className="mt-4 border-t border-primary/10 pt-4">
        <InquiryStatusActions
          canUpdate={canUpdate}
          isUpdating={isUpdating}
          onChange={onStatusChange}
          status={inquiry.status}
        />
      </View>
    </View>
  );
}
