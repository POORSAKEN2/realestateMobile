import { Feather, Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { Inquiry, InquiryStatus } from "../../types/domain/inquiries";
import { formatInquiryDate } from "../../utils/inquiries/inquiryDomain";
import { InquiryStatusActions } from "./InquiryStatusActions";

function DetailField({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row gap-3 border-b border-primary/10 py-4 last:border-b-0">
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
        <Feather name={icon} size={17} color={colors.primary} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wider text-description">
          {label}
        </Text>
        <Text className="mt-1 font-ralewayBold text-sm leading-5 text-textPrimary">
          {value}
        </Text>
      </View>
    </View>
  );
}

export function InquiryDetail({
  canUpdate,
  inquiry,
  isUpdating,
  onContactGuest,
  onStatusChange,
}: {
  canUpdate: boolean;
  inquiry: Inquiry;
  isUpdating: boolean;
  onContactGuest: () => void;
  onStatusChange: (status: InquiryStatus) => void;
}) {
  return (
    <View className="gap-4 pb-8">
      <View className="rounded-[28px] border border-primary/15 bg-white p-5 shadow-sm shadow-primary/5">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent/25">
            <Ionicons name="person-outline" size={26} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayExtraBold text-xl text-textPrimary">
              {inquiry.guest.name}
            </Text>
            <Text className="mt-1 font-ralewayMedium text-sm text-description">
              Guest inquiry
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <DetailField
            icon="at-sign"
            label="Contact"
            value={inquiry.guest.contact || "Not supplied"}
          />
          <DetailField
            icon="tag"
            label="Listing"
            value={inquiry.listing.title}
          />
          <DetailField
            icon="home"
            label="Property"
            value={inquiry.property.title}
          />
          <DetailField
            icon="calendar"
            label="Received"
            value={formatInquiryDate(inquiry.createdAt)}
          />
        </View>

        {inquiry.guest.contact ? (
          <TouchableOpacity
            accessibilityRole="link"
            activeOpacity={0.8}
            className="mt-2 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary"
            onPress={onContactGuest}
          >
            <Feather
              name={inquiry.guest.contact.includes("@") ? "mail" : "phone"}
              size={17}
              color={colors.whitePrimary}
            />
            <Text className="font-ralewayExtraBold text-sm text-white">
              Contact guest
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="rounded-[28px] border border-primary/15 bg-white p-5">
        <Text className="font-ralewayExtraBold text-base text-textPrimary">
          Message
        </Text>
        <Text className="mt-3 font-ralewayMedium text-sm leading-6 text-textPrimary">
          {inquiry.message || "No message supplied."}
        </Text>
      </View>

      <View className="rounded-[28px] border border-primary/15 bg-white p-5">
        <InquiryStatusActions
          canUpdate={canUpdate}
          isUpdating={isUpdating}
          onChange={onStatusChange}
          status={inquiry.status}
        />
        {!canUpdate ? (
          <Text className="mt-3 font-ralewayMedium text-xs leading-5 text-description">
            Status changes require update permission and Tier 1 or All-In
            access.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
