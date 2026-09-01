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

import { LeaseLedgerModal } from "../../components/payments/LeaseLedgerModal";
import { PaymentCard } from "../../components/payments/PaymentCard";
import { RecordPaymentModal } from "../../components/payments/RecordPaymentModal";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { ScreenSnackbar } from "../../components/ui/Snackbar";
import { colors } from "../../constants/colors";
import { usePayments, useRecordPayment } from "../../hooks/api/usePayments";
import type { Payment, PaymentStatus, RecordPaymentPayload } from "../../types";

const STATUS_FILTERS: Array<{ label: string; value: PaymentStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Overdue", value: "Overdue" },
  { label: "Pending", value: "Pending" },
  { label: "Paid", value: "Paid" },
];

export default function RentScreen() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentForRecord, setSelectedPaymentForRecord] = useState<Payment | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [ledgerLeaseId, setLedgerLeaseId] = useState<string | null>(null);
  const [ledgerLeaseTitle, setLedgerLeaseTitle] = useState<string | undefined>(undefined);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const { data: payments = [], isLoading, isRefetching, refetch } = usePayments();
  const recordPaymentMutation = useRecordPayment();

  // Filter and search payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const tenant = (p.lessee?.name || p.lease?.lessee?.name || "").toLowerCase();
        const property = (p.property?.title || p.lease?.property?.title || "").toLowerCase();
        const ref = (p.reference_no || p.referenceNo || "").toLowerCase();
        const type = (p.type || "").toLowerCase();

        return (
          tenant.includes(query) ||
          property.includes(query) ||
          ref.includes(query) ||
          type.includes(query)
        );
      }

      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  // Aggregate Metrics
  const { totalCollected, totalPending, totalOverdue } = useMemo(() => {
    let collected = 0;
    let pending = 0;
    let overdue = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.status === "Paid") collected += amt;
      else if (p.status === "Pending") pending += amt;
      else if (p.status === "Overdue") overdue += amt;
    });

    return {
      totalCollected: collected,
      totalPending: pending,
      totalOverdue: overdue,
    };
  }, [payments]);

  function handleOpenRecordModal(payment?: Payment) {
    if (payment) {
      setSelectedPaymentForRecord(payment);
    } else {
      setSelectedPaymentForRecord(null);
    }
    setIsRecordModalOpen(true);
  }

  function handleOpenLedger(payment: Payment) {
    const leaseId = payment.lease_id || payment.leaseId || payment.lease?.id;
    if (leaseId) {
      setLedgerLeaseId(leaseId);
      setLedgerLeaseTitle(
        payment.property?.title || payment.lease?.property?.title || "Lease Ledger",
      );
    }
  }

  async function handleRecordSubmit(payload: RecordPaymentPayload) {
    await recordPaymentMutation.mutateAsync(payload);
    setSnackbarMessage("Payment recorded successfully!");
  }

  return (
    <Screen bottomInset="tab-bar" className="bg-surface">
      <ModuleHeader
        action={
          <TouchableOpacity
            accessibilityLabel="Record new payment"
            accessibilityRole="button"
            activeOpacity={0.8}
            className="h-10 px-3.5 flex-row items-center justify-center rounded-2xl bg-primary"
            onPress={() => setIsRecordModalOpen(true)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="ml-1 font-ralewayBold text-xs text-white">
              Record
            </Text>
          </TouchableOpacity>
        }
        eyebrow="Financial Operations"
        title="Rent Collection"
      />

      <View className="flex-1">
        {/* Metric Strip */}
        <View className="mt-4 flex-row gap-2.5">
          <View className="flex-1 rounded-2xl border border-success/20 bg-successSurface p-3">
            <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-success">
              Collected
            </Text>
            <Text className="mt-1 font-ralewayExtraBold text-sm text-success" numberOfLines={1}>
              ₱{totalCollected.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-warning/20 bg-warningSurface p-3">
            <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-warning">
              Pending
            </Text>
            <Text className="mt-1 font-ralewayExtraBold text-sm text-warning" numberOfLines={1}>
              ₱{totalPending.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-danger/20 bg-dangerSurface p-3">
            <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-danger">
              Overdue
            </Text>
            <Text className="mt-1 font-ralewayExtraBold text-sm text-danger" numberOfLines={1}>
              ₱{totalOverdue.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="mt-4 h-12 flex-row items-center rounded-2xl border border-primary/20 bg-white px-3.5 shadow-sm shadow-primary/5">
          <Feather name="search" size={16} color={colors.description} />
          <TextInput
            accessibilityLabel="Search payments"
            className="ml-2.5 flex-1 font-ralewayMedium text-sm text-textPrimary"
            onChangeText={setSearchQuery}
            placeholder="Search tenant, property, ref no..."
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

        {/* Payments List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            className="flex-1 -mx-1 px-1"
            contentContainerClassName="pb-16 pt-2"
            data={filteredPayments}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                refreshing={isRefetching}
                tintColor={colors.primary}
                onRefresh={refetch}
              />
            }
            renderItem={({ item }) => (
              <PaymentCard
                payment={item}
                onRecordPayment={handleOpenRecordModal}
                onViewLedger={handleOpenLedger}
              />
            )}
            ListEmptyComponent={
              <View className="items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-white p-8 mt-4">
                <Ionicons name="wallet-outline" size={40} color={colors.description} />
                <Text className="mt-3 font-ralewayBold text-base text-textPrimary">
                  No payment records found
                </Text>
                <Text className="mt-1 text-center text-xs text-description">
                  {searchQuery || statusFilter !== "ALL"
                    ? "Try adjusting your search or filter filters."
                    : "Payment schedules are automatically generated when leases are activated."}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isPending={recordPaymentMutation.isPending}
        isVisible={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedPaymentForRecord(null);
        }}
        onSubmit={handleRecordSubmit}
        prefillPayment={selectedPaymentForRecord}
      />

      {/* Financial Ledger Modal */}
      {ledgerLeaseId ? (
        <LeaseLedgerModal
          isVisible={Boolean(ledgerLeaseId)}
          leaseId={ledgerLeaseId}
          leaseTitle={ledgerLeaseTitle}
          onClose={() => setLedgerLeaseId(null)}
          onRecordPayment={(payment) => {
            setLedgerLeaseId(null);
            handleOpenRecordModal(payment);
          }}
        />
      ) : null}

      {/* Snackbar feedback */}
      <ScreenSnackbar
        message={snackbarMessage || ""}
        onDismiss={() => setSnackbarMessage(null)}
      />
    </Screen>
  );
}
