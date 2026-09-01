import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LeadCard } from "../../components/leads/LeadCard";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { colors } from "../../constants/colors";
import { useLeads, useUpdateLeadStatus } from "../../hooks/api/useLeads";
import type { ListingLead, ListingLeadStatus } from "../../types/domain/leads";

const STATUS_FILTERS: Array<{ label: string; value: ListingLeadStatus | "ALL" }> = [
  { label: "All Leads", value: "ALL" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Closed", value: "closed" },
];

export default function InquiriesScreen() {
  const [statusFilter, setStatusFilter] = useState<ListingLeadStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const { data: leads = [], isLoading, isRefetching, refetch } = useLeads();
  const updateStatusMutation = useUpdateLeadStatus();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== "ALL" && lead.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (lead.name || "").toLowerCase();
        const property = (lead.propertyTitle || "").toLowerCase();
        const contact = (lead.contact || "").toLowerCase();
        const msg = (lead.message || "").toLowerCase();

        return (
          name.includes(query) ||
          property.includes(query) ||
          contact.includes(query) ||
          msg.includes(query)
        );
      }

      return true;
    });
  }, [leads, statusFilter, searchQuery]);

  async function handleStatusChange(lead: ListingLead, nextStatus: ListingLeadStatus) {
    try {
      await updateStatusMutation.mutateAsync({
        id: lead.id,
        leadType: lead.leadType,
        status: nextStatus,
      });
      setSnackbarMessage(`Lead status updated to ${nextStatus}.`);
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          eyebrow="Marketplace"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from inquiries"
              variant="secondary"
            />
          }
          title="Inquiries & Leads"
        />
        <Text className="mt-2 text-base leading-6 text-description">
          Review and respond to prospect inquiries and viewing requests from Terrane Homes.
        </Text>

        {/* Search Bar */}
        <View className="mt-4 h-12 flex-row items-center rounded-2xl border border-primary/20 bg-white px-3.5 shadow-sm shadow-primary/5">
          <Feather name="search" size={16} color={colors.description} />
          <TextInput
            accessibilityLabel="Search leads"
            className="ml-2.5 flex-1 font-ralewayMedium text-sm text-textPrimary"
            onChangeText={setSearchQuery}
            placeholder="Search seeker name, property, phone..."
            placeholderTextColor={colors.description}
            value={searchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.description} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View className="mt-3 flex-row gap-2 pb-2">
          {STATUS_FILTERS.map((tab) => {
            const isSelected = statusFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                activeOpacity={0.8}
                className={`rounded-full border px-3.5 py-1.5 ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-primary/15 bg-white"
                }`}
                onPress={() => setStatusFilter(tab.value)}
              >
                <Text
                  className={`font-ralewayBold text-xs ${
                    isSelected ? "text-white" : "text-description"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Leads List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            className="flex-1 -mx-1 px-1 mt-2"
            contentContainerClassName="pb-16 pt-1"
            data={filteredLeads}
            keyExtractor={(item) => `${item.leadType}-${item.id}`}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                refreshing={isRefetching}
                tintColor={colors.primary}
                onRefresh={refetch}
              />
            }
            renderItem={({ item }) => (
              <LeadCard lead={item} onUpdateStatus={handleStatusChange} />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white p-8 mt-4">
                <Ionicons name="mail-unread-outline" size={40} color={colors.description} />
                <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                  No inquiries found
                </Text>
                <Text className="mt-1 text-center text-xs text-description">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Try clearing your search or filter."
                    : "Inquiries submitted on your public marketplace listings will appear here."}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ScreenSnackbar
        message={snackbarMessage || ""}
        onDismiss={() => setSnackbarMessage(null)}
      />
    </Screen>
  );
}
