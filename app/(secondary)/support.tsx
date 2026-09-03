import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { FaqAccordion } from "../../components/support/FaqAccordion";
import { SupportTicketModal } from "../../components/support/SupportTicketModal";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { colors } from "../../constants/colors";
import {
  useCreateSupportTicket,
  useFaqs,
  useSupportTickets,
} from "../../hooks/api/useSupport";
import type { CreateSupportTicketPayload } from "../../types/domain/support";

export default function SupportScreen() {
  const [activeTab, setActiveTab] = useState<"faqs" | "tickets">("faqs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const { data: faqs = [], isLoading: isFaqsLoading, refetch: refetchFaqs } = useFaqs();
  const { data: tickets = [], isLoading: isTicketsLoading, refetch: refetchTickets } = useSupportTickets();
  const createTicketMutation = useCreateSupportTicket();

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const q = searchQuery.toLowerCase();
    return faqs.filter(
      (f) =>
        (f.question || f.title || "").toLowerCase().includes(q) ||
        (f.answer || f.content || "").toLowerCase().includes(q),
    );
  }, [faqs, searchQuery]);

  async function handleCreateTicket(payload: CreateSupportTicketPayload) {
    await createTicketMutation.mutateAsync(payload);
    setSnackbarMessage("Support ticket submitted. Our team will reach out soon.");
    setActiveTab("tickets");
  }

  return (
    <Screen className="bg-surface">
      <View className="flex-1">
        <ModuleHeader
          action={
            <TouchableOpacity
              accessibilityLabel="Create support ticket"
              accessibilityRole="button"
              activeOpacity={0.8}
              className="h-10 px-3.5 flex-row items-center justify-center rounded-2xl bg-primary"
              onPress={() => setIsTicketModalOpen(true)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="ml-1 font-ralewayBold text-xs text-white">
                Ticket
              </Text>
            </TouchableOpacity>
          }
          eyebrow="Account"
          leading={
            <SecondaryBackButton
              accessibilityLabel="Back from support"
              variant="secondary"
            />
          }
          title="Support Center"
        />
        <Text className="mt-2 text-base leading-6 text-description">
          Find instant answers to common questions or submit a ticket to our support team.
        </Text>

        {/* Tab Switcher */}
        <View className="mt-4 flex-row rounded-2xl bg-primary/10 p-1">
          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-1 h-10 items-center justify-center rounded-xl ${
              activeTab === "faqs" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("faqs")}
          >
            <Text
              className={`font-ralewayBold text-xs ${
                activeTab === "faqs" ? "text-primary" : "text-description"
              }`}
            >
              Knowledge Base FAQs ({faqs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className={`flex-1 h-10 items-center justify-center rounded-xl ${
              activeTab === "tickets" ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("tickets")}
          >
            <Text
              className={`font-ralewayBold text-xs ${
                activeTab === "tickets" ? "text-primary" : "text-description"
              }`}
            >
              My Tickets ({tickets.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "faqs" ? (
          <View className="flex-1 mt-4">
            {/* Search Bar */}
            <View className="h-12 flex-row items-center rounded-2xl border border-primary/20 bg-white px-3.5 shadow-sm shadow-primary/5 mb-3">
              <Feather name="search" size={16} color={colors.description} />
              <TextInput
                accessibilityLabel="Search FAQs"
                className="ml-2.5 flex-1 font-ralewayMedium text-sm text-textPrimary"
                onChangeText={setSearchQuery}
                placeholder="Search help topics..."
                placeholderTextColor={colors.description}
                value={searchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color={colors.description} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* FAQs List */}
            {isFaqsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <PullToRefreshFlatList
                className="flex-1 -mx-1 px-1"
                contentContainerClassName="pb-12 pt-1"
                data={filteredFaqs}
                keyExtractor={(item) => String(item.id)}
                onRefresh={refetchFaqs}
                renderItem={({ item }) => <FaqAccordion faq={item} />}
                ListEmptyComponent={
                  <View className="items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white p-8 mt-4">
                    <Feather name="help-circle" size={36} color={colors.description} />
                    <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                      No matching FAQs
                    </Text>
                    <Text className="mt-1 text-center text-xs text-description">
                      Can't find what you need? Tap "Ticket" above to contact support.
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        ) : (
          <View className="flex-1 mt-4">
            {isTicketsLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <PullToRefreshFlatList
                className="flex-1 -mx-1 px-1"
                contentContainerClassName="pb-12 pt-1"
                data={tickets}
                keyExtractor={(item) => String(item.id)}
                onRefresh={refetchTickets}
                renderItem={({ item }) => {
                  const isResolved = item.status === "Resolved" || item.status === "Closed";
                  return (
                    <View className="mb-3 rounded-2xl border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-ralewayBold text-base text-textPrimary flex-1 pr-2">
                          {item.subject}
                        </Text>
                        <View
                          className={`rounded-full px-2.5 py-1 ${
                            isResolved ? "bg-success/10" : "bg-warning/10"
                          }`}
                        >
                          <Text
                            className={`font-ralewayBold text-[10px] uppercase ${
                              isResolved ? "text-success" : "text-warning"
                            }`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="mt-2 font-ralewayMedium text-xs leading-5 text-description">
                        {item.description}
                      </Text>
                      {item.created_at ? (
                        <Text className="mt-2 font-ralewayMedium text-[10px] text-description/70">
                          Submitted {item.created_at.slice(0, 10)}
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View className="items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white p-8 mt-4">
                    <Ionicons name="chatbubbles-outline" size={36} color={colors.description} />
                    <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                      No support tickets yet
                    </Text>
                    <Text className="mt-1 text-center text-xs text-description">
                      Need help? Tap the "Ticket" button at the top right.
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Contact shortcuts banner */}
        <View className="mt-auto mb-2 flex-row gap-2 border-t border-primary/10 pt-3">
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-primary/10"
            onPress={() => Linking.openURL("mailto:support@terrane.app")}
          >
            <Feather name="mail" size={15} color={colors.primary} />
            <Text className="ml-2 font-ralewayBold text-xs text-primary">
              Email Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-primary/10"
            onPress={() => Linking.openURL("tel:+639171234567")}
          >
            <Feather name="phone" size={15} color={colors.primary} />
            <Text className="ml-2 font-ralewayBold text-xs text-primary">
              Hotline
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <SupportTicketModal
        isPending={createTicketMutation.isPending}
        isVisible={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={handleCreateTicket}
      />

      <ScreenSnackbar
        message={snackbarMessage || ""}
        onDismiss={() => setSnackbarMessage(null)}
      />
    </Screen>
  );
}
