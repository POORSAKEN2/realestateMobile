import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CollectionOverview } from "../../components/payments/CollectionOverview";
import { PullToRefreshFlatList } from "../../components/ui/PullToRefreshFlatList";
import { LeaseLedgerModal } from "../../components/payments/LeaseLedgerModal";
import { PaymentCard } from "../../components/payments/PaymentCard";
import { RecordPaymentModal } from "../../components/payments/RecordPaymentModal";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { PermissionGate } from "../../components/auth/PermissionGate";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { useAccess } from "../../hooks/auth/useAccess";
import {
  usePaymentOverview,
  usePaymentPages,
  useCollectPayment,
  useRecordPayment,
} from "../../hooks/api/usePayments";
import type { Payment, RecordPaymentPayload } from "../../types";
import type {
  PaymentBucket,
  CollectPaymentPayload,
} from "../../types/domain/payments";

const FILTERS: readonly { label: string; value: PaymentBucket }[] = [
  { label: "All", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Collected this month", value: "collected" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
];

export function RentScreen({
  navigationLevel = "primary",
}: {
  navigationLevel?: "primary" | "secondary";
}) {
  const palette = useThemeColors();
  const { can } = useAccess();
  const [bucket, setBucket] = useState<PaymentBucket>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedPaymentForRecord, setSelectedPaymentForRecord] =
    useState<Payment | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [ledgerPayment, setLedgerPayment] = useState<Payment | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const overview = usePaymentOverview();
  const list = usePaymentPages({ bucket, search });
  const payments = useMemo(
    () => list.data?.pages.flatMap((page) => page.items) ?? [],
    [list.data],
  );
  const recordMutation = useRecordPayment();
  const collectMutation = useCollectPayment();
  const refresh = async () => {
    await Promise.all([overview.refetch(), list.refetch()]);
  };
  const openRecord = (payment?: Payment) => {
    setSelectedPaymentForRecord(payment ?? null);
    setIsRecordModalOpen(true);
  };
  const ledgerLeaseId =
    ledgerPayment?.lease_id ||
    ledgerPayment?.leaseId ||
    ledgerPayment?.lease?.id;
  const header = (
    <View className="pb-3">
      <CollectionOverview
        data={overview.data}
        loading={overview.isPending}
        error={overview.error}
        onRetry={() => {
          void overview.refetch();
        }}
        onSelect={setBucket}
      />
      <View className="mt-4 h-12 flex-row items-center rounded-2xl border border-primary/20 bg-panel px-3.5">
        <Feather name="search" size={16} color={palette.description} />
        <TextInput
          accessibilityLabel="Search payments"
          className="ml-2.5 flex-1 font-ralewayMedium text-sm text-textPrimary"
          maxLength={200}
          onChangeText={setSearchQuery}
          placeholder="Search tenant, property, reference…"
          placeholderTextColor={palette.description}
          value={searchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear payment search"
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={palette.description}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text className="mt-2 text-xs text-description">
        Search filters payment list only.
      </Text>
      <ScrollView
        horizontal
        className="mt-3"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            accessibilityRole="button"
            accessibilityState={{ selected: bucket === filter.value }}
            className={`rounded-full border px-3.5 py-2 ${bucket === filter.value ? "border-primary bg-primary" : "border-primary/15 bg-panel"}`}
            onPress={() => setBucket(filter.value)}
          >
            <Text
              className={`font-ralewayBold text-xs ${bucket === filter.value ? "text-white" : "text-description"}`}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text className="mt-3 font-ralewayBold text-sm text-textPrimary">
        {FILTERS.find((filter) => filter.value === bucket)?.label} payments
      </Text>
      {list.isError && payments.length ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            void list.refetch();
          }}
        >
          <Text className="mt-2 text-sm text-description">
            Could not refresh list. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
  return (
    <Screen
      bottomInset={navigationLevel === "secondary" ? "safe-area" : "tab-bar"}
      className="bg-surface"
    >
      <ModuleHeader
        title="Rent Collection"
        eyebrow="Operations"
        leading={
          navigationLevel === "secondary" ? (
            <SecondaryBackButton
              accessibilityLabel="Back from rent collection"
              variant="secondary"
            />
          ) : undefined
        }
        action={
          <PermissionGate permission="payments.create">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Record new payment"
              accessibilityHint={
                !can("leases.viewAny")
                  ? "Lease access required to record a standalone payment"
                  : undefined
              }
              disabled={!can("leases.viewAny")}
              accessibilityState={{ disabled: !can("leases.viewAny") }}
              className={`h-10 flex-row items-center justify-center rounded-2xl bg-primary px-3.5 ${!can("leases.viewAny") ? "opacity-50" : ""}`}
              onPress={() => openRecord()}
            >
              <Ionicons name="add" size={18} color={palette.whitePrimary} />
              <Text className="ml-1 font-ralewayBold text-xs text-white">
                Record
              </Text>
            </TouchableOpacity>
          </PermissionGate>
        }
      />
      <PullToRefreshFlatList
        className="-mx-1 flex-1 px-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={header}
        data={payments}
        keyExtractor={(payment) => payment.id}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <PaymentCard
            payment={item}
            onRecordPayment={openRecord}
            onViewLedger={setLedgerPayment}
          />
        )}
        ListEmptyComponent={
          list.isPending ? (
            <ActivityIndicator color={palette.primary} className="mt-6" />
          ) : (
            <View className="mt-4 items-center rounded-3xl border border-primary/20 bg-panel p-6">
              <Text className="font-ralewayBold text-base text-textPrimary">
                {list.isError
                  ? "Payment list unavailable"
                  : "No matching payments"}
              </Text>
              <Text className="mt-2 text-center text-sm text-description">
                {list.isError
                  ? list.error.message
                  : "Change the filter or search to view other payment records."}
              </Text>
              {list.isError ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    void list.refetch();
                  }}
                  className="mt-3 rounded-xl bg-primary/10 px-4 py-2"
                >
                  <Text className="font-ralewayBold text-textPrimary">
                    Retry payments
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          list.hasNextPage ? (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={list.isFetchingNextPage}
              className="my-3 items-center rounded-2xl border border-primary/20 bg-panel p-4"
              onPress={() => {
                void list.fetchNextPage();
              }}
            >
              <Text className="font-ralewayBold text-textPrimary">
                {list.isFetchingNextPage
                  ? "Loading more…"
                  : list.isFetchNextPageError
                    ? "Retry loading more"
                    : "Load more payments"}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
      <RecordPaymentModal
        isPending={recordMutation.isPending || collectMutation.isPending}
        isVisible={isRecordModalOpen}
        prefillPayment={selectedPaymentForRecord}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedPaymentForRecord(null);
        }}
        onSubmit={async (payload: RecordPaymentPayload) => {
          await recordMutation.mutateAsync(payload);
          setSnackbarMessage("Payment recorded successfully.");
        }}
        onCollect={async (payload: CollectPaymentPayload) => {
          if (!selectedPaymentForRecord) return;
          await collectMutation.mutateAsync({
            id: selectedPaymentForRecord.id,
            payload,
          });
          setSnackbarMessage("Collection recorded successfully.");
        }}
      />
      {ledgerLeaseId ? (
        <LeaseLedgerModal
          isVisible
          leaseId={ledgerLeaseId}
          leaseTitle={
            ledgerPayment?.property?.title ||
            ledgerPayment?.lease?.property?.title
          }
          onClose={() => setLedgerPayment(null)}
          onRecordPayment={(payment) => {
            setLedgerPayment(null);
            openRecord(payment);
          }}
        />
      ) : null}
      <ScreenSnackbar
        message={snackbarMessage || ""}
        onDismiss={() => setSnackbarMessage(null)}
      />
    </Screen>
  );
}
export default RentScreen;
