import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Linking, Text, TextInput, TouchableOpacity, View } from "react-native";

import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { FaqAccordion } from "../../components/support/FaqAccordion";
import { SupportTicketModal } from "../../components/support/SupportTicketModal";
import { SupportListFeedback } from "../../components/support/SupportListFeedback";
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
import type {
  CreateSupportTicketPayload,
  FAQItem,
} from "../../types/domain/support";
import { useBillingEntitlement } from "../../hooks/api/useBillingEntitlement";
import { supportLevelLabel } from "../../utils/billing/entitlementCapabilities";

const EMPTY_FAQS: FAQItem[] = [];

export default function SupportScreen() {
  const [activeTab, setActiveTab] = useState<"faqs" | "tickets">("faqs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const faqQuery = useFaqs();
  const ticketQuery = useSupportTickets();
  const faqs = faqQuery.data ?? EMPTY_FAQS;
  const tickets = ticketQuery.data ?? [];
  const createTicketMutation = useCreateSupportTicket();
  const entitlementQuery = useBillingEntitlement();
  const currentSupportLevel =
    entitlementQuery.data?.limits?.support_level?.level;

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
    setSnackbarMessage(
      "Support ticket submitted. Our team will reach out soon.",
    );
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
              className="h-11 w-11 items-center justify-center rounded-2xl bg-primary"
              onPress={() => setIsTicketModalOpen(true)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
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
          Find instant answers to common questions or submit a ticket to our
          support team.
        </Text>

        <View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-panel">
            <Feather name="headphones" size={18} color={colors.primary} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-ralewayBold text-sm text-textPrimary">
              {supportLevelLabel(currentSupportLevel)}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-description">
              New tickets use the support level active when submitted.
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View className="mt-4 flex-row rounded-2xl bg-primary/10 p-1">
          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "faqs" }}
            activeOpacity={0.8}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 py-2 shadow-none ${
              activeTab === "faqs" ? "bg-panel shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("faqs")}
          >
            <Text
              className={`font-ralewayBold text-xs ${
                activeTab === "faqs"
                  ? "text-primaryContent"
                  : "text-description"
              }`}
            >
              Knowledge Base FAQs
              {faqQuery.data !== undefined ? ` (${faqs.length})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "tickets" }}
            activeOpacity={0.8}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 py-2 shadow-none ${
              activeTab === "tickets" ? "bg-panel shadow-sm" : ""
            }`}
            onPress={() => setActiveTab("tickets")}
          >
            <Text
              className={`font-ralewayBold text-xs ${
                activeTab === "tickets"
                  ? "text-primaryContent"
                  : "text-description"
              }`}
            >
              My Tickets
              {ticketQuery.data !== undefined ? ` (${tickets.length})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "faqs" ? (
          <View key="faqs" className="mt-4 flex-1">
            {/* Search Bar */}
            <View className="mb-3 h-12 flex-row items-center rounded-2xl border border-primary/20 bg-panel px-3.5 shadow-sm shadow-primary/5">
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
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.description}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* FAQs List */}
            <SupportListFeedback
              label="FAQs"
              hasData={faqQuery.data !== undefined}
              isPending={faqQuery.isPending}
              isError={faqQuery.isError}
              isFetching={faqQuery.isFetching}
              onRetry={() => {
                void faqQuery.refetch();
              }}
            />
            {faqQuery.data !== undefined ? (
              <PullToRefreshFlatList
                className="-mx-1 flex-1 px-1"
                contentContainerClassName="pb-12 pt-1"
                data={filteredFaqs}
                keyExtractor={(item) => String(item.id)}
                onRefresh={faqQuery.refetch}
                renderItem={({ item }) => <FaqAccordion faq={item} />}
                ListEmptyComponent={
                  faqQuery.isError ? null : (
                    <View className="mt-4 items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-panel p-8">
                      <Feather
                        name="help-circle"
                        size={36}
                        color={colors.description}
                      />
                      <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                        {faqs.length > 0
                          ? "No matching FAQs"
                          : "No FAQs available"}
                      </Text>
                      <Text className="mt-1 text-center text-xs text-description">
                        {faqs.length > 0
                          ? "Try another search or use the + button to create a support ticket."
                          : "Use the + button to create a support ticket."}
                      </Text>
                    </View>
                  )
                }
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </View>
        ) : (
          <View key="tickets" className="mt-4 flex-1">
            <SupportListFeedback
              label="tickets"
              hasData={ticketQuery.data !== undefined}
              isPending={ticketQuery.isPending}
              isError={ticketQuery.isError}
              isFetching={ticketQuery.isFetching}
              onRetry={() => {
                void ticketQuery.refetch();
              }}
            />
            {ticketQuery.data !== undefined ? (
              <PullToRefreshFlatList
                className="-mx-1 flex-1 px-1"
                contentContainerClassName="pb-12 pt-1"
                data={tickets}
                keyExtractor={(item) => String(item.id)}
                onRefresh={ticketQuery.refetch}
                renderItem={({ item }) => {
                  const isResolved =
                    item.status === "Resolved" || item.status === "Closed";
                  return (
                    <View className="mb-3 rounded-2xl border border-primary/15 bg-panel p-4 shadow-sm shadow-primary/5">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 pr-2 font-ralewayBold text-base text-textPrimary">
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
                      {item.support_level ? (
                        <Text className="mt-2 font-ralewayBold text-[10px] uppercase text-primary">
                          {supportLevelLabel(item.support_level)}
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
                ListEmptyComponent={
                  ticketQuery.isError ? null : (
                    <View className="mt-4 items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-panel p-8">
                      <Ionicons
                        name="chatbubbles-outline"
                        size={36}
                        color={colors.description}
                      />
                      <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                        No support tickets yet
                      </Text>
                      <Text className="mt-1 text-center text-xs text-description">
                        Need help? Use the + button to create a support ticket.
                      </Text>
                    </View>
                  )
                }
                showsVerticalScrollIndicator={false}
              />
            ) : null}
          </View>
        )}

        {/* Contact shortcuts banner */}
        <View className="mb-2 mt-auto flex-row gap-2 border-t border-primary/10 pt-3">
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-11 flex-1 flex-row items-center justify-center rounded-xl bg-primary/10"
            onPress={() => Linking.openURL("mailto:support@terrane.app")}
          >
            <Feather name="mail" size={15} color={colors.primary} />
            <Text className="ml-2 font-ralewayBold text-xs text-primary">
              Email Support
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="h-11 flex-1 flex-row items-center justify-center rounded-xl bg-primary/10"
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
