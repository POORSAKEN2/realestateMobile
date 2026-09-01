import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { ListingLead, ListingLeadStatus } from "../../types/domain/leads";

type LeadCardProps = {
  lead: ListingLead;
  onUpdateStatus: (lead: ListingLead, status: ListingLeadStatus) => void;
};

export function LeadCard({ lead, onUpdateStatus }: LeadCardProps) {
  const isViewing = lead.leadType === "viewing";
  const isNew = lead.status === "new";
  const isContacted = lead.status === "contacted";
  const isClosed = lead.status === "closed";

  const statusBg = isNew
    ? "bg-accent/15 border-accent"
    : isContacted
      ? "bg-primary/10 border-primary/20"
      : "bg-description/10 border-description/20";

  const statusText = isNew
    ? "text-primary"
    : isContacted
      ? "text-primary"
      : "text-description";

  function handleContact() {
    if (lead.contact) {
      if (lead.contact.includes("@")) {
        Linking.openURL(`mailto:${lead.contact}`);
      } else {
        Linking.openURL(`tel:${lead.contact}`);
      }
    }
  }

  return (
    <View className="mb-3 rounded-[24px] border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5">
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2.5">
          <View
            className={`h-9 w-9 items-center justify-center rounded-2xl ${
              isViewing ? "bg-primary/10" : "bg-accent/20"
            }`}
          >
            <Ionicons
              name={isViewing ? "calendar-outline" : "mail-outline"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View>
            <Text className="font-ralewayBold text-base text-textPrimary">
              {lead.name}
            </Text>
            <Text className="font-ralewayMedium text-xs text-description">
              {lead.propertyTitle || "Marketplace Listing"}
            </Text>
          </View>
        </View>

        {/* Status Pill */}
        <View className={`rounded-full border px-2.5 py-1 ${statusBg}`}>
          <Text className={`font-ralewayBold text-[10px] uppercase tracking-wider ${statusText}`}>
            {lead.status}
          </Text>
        </View>
      </View>

      {/* Message or Viewing Schedule */}
      {isViewing ? (
        <View className="my-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
          <View className="flex-row items-center gap-1.5">
            <Feather name="clock" size={13} color={colors.primary} />
            <Text className="font-ralewayBold text-xs text-primary">
              Requested Viewing: {lead.viewingDate || "Date TBD"} {lead.viewingTime ? `at ${lead.viewingTime}` : ""}
            </Text>
          </View>
        </View>
      ) : lead.message ? (
        <View className="my-3 rounded-2xl border border-primary/5 bg-surface p-3">
          <Text className="font-ralewayMedium text-xs leading-5 text-textPrimary">
            "{lead.message}"
          </Text>
        </View>
      ) : null}

      {/* Contact Details & Action Buttons */}
      <View className="mt-2 flex-row items-center justify-between border-t border-primary/5 pt-3">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-1.5"
          onPress={handleContact}
        >
          <Feather
            name={lead.contact?.includes("@") ? "mail" : "phone"}
            size={13}
            color={colors.primary}
          />
          <Text className="font-ralewayBold text-xs text-primary underline">
            {lead.contact}
          </Text>
        </TouchableOpacity>

        {/* Status Transition Actions */}
        <View className="flex-row gap-1.5">
          {isNew ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-xl bg-primary px-3 py-1.5"
              onPress={() => onUpdateStatus(lead, "contacted")}
            >
              <Text className="font-ralewayBold text-[11px] text-white">
                Mark Contacted
              </Text>
            </TouchableOpacity>
          ) : isContacted ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5"
              onPress={() => onUpdateStatus(lead, "closed")}
            >
              <Text className="font-ralewayBold text-[11px] text-primary">
                Close Lead
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-xl bg-surface px-3 py-1.5"
              onPress={() => onUpdateStatus(lead, "new")}
            >
              <Text className="font-ralewayBold text-[11px] text-description">
                Reopen
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
