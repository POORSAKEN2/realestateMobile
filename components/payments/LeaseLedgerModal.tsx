import { PermissionGate } from "../auth/PermissionGate";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPaymentStatusPresentation } from "../../constants/paymentStatusPresentation";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { colors } from "../../constants/colors";
import { useLeaseLedger } from "../../hooks/api/usePayments";
import type { Payment } from "../../types";
import { ModalHeader } from "../ui/ModalHeader";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { parseDateValue } from "../../utils/expenses/expenseForm";

type LeaseLedgerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  leaseId: string;
  leaseTitle?: string;
  onRecordPayment?: (payment: Payment) => void;
};

export function LeaseLedgerModal({
  isVisible,
  onClose,
  leaseId,
  leaseTitle,
  onRecordPayment,
}: LeaseLedgerModalProps) {
  const palette = useThemeColors();
  const { data: ledger, isLoading, error } = useLeaseLedger(leaseId, isVisible);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        <ModalHeader
          closeAccessibilityLabel="Close financial ledger"
          onClose={onClose}
          subtitle={leaseTitle || "Lease payment schedule and history"}
          title="Financial Ledger"
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons
              name="alert-circle-outline"
              size={40}
              color={colors.danger}
            />
            <Text className="mt-2 font-ralewayBold text-base text-textPrimary">
              Failed to load ledger
            </Text>
            <Text className="mt-1 text-center text-xs text-description">
              {error instanceof Error ? error.message : "Something went wrong."}
            </Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerClassName="pb-12 gap-4"
            showsVerticalScrollIndicator={false}
          >
            {/* KPI Summary Tiles */}
            <View className="flex-row flex-wrap gap-2.5">
              <View className="min-w-[45%] flex-1 rounded-2xl border border-primary/15 bg-panel p-3.5 shadow-sm shadow-primary/5">
                <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-description">
                  Total Due
                </Text>
                <Text className="mt-1 font-ralewayBold text-base text-textPrimary">
                  {formatCurrency(Number(ledger?.total_due || 0), 2)}
                </Text>
              </View>

              <View
                className={`min-w-[45%] flex-1 rounded-2xl border p-3.5 shadow-sm shadow-primary/5 ${getPaymentStatusPresentation("Paid").containerClass}`}
              >
                <Text
                  className={`font-ralewaySemiBold text-[10px] uppercase tracking-wider ${getPaymentStatusPresentation("Paid").textClass}`}
                >
                  Total Paid
                </Text>
                <Text
                  className={`mt-1 font-ralewayBold text-base ${getPaymentStatusPresentation("Paid").textClass}`}
                >
                  {formatCurrency(Number(ledger?.total_paid || 0), 2)}
                </Text>
              </View>

              <View
                className={`min-w-[45%] flex-1 rounded-2xl border p-3.5 shadow-sm shadow-primary/5 ${getPaymentStatusPresentation("Pending").containerClass}`}
              >
                <Text
                  className={`font-ralewaySemiBold text-[10px] uppercase tracking-wider ${getPaymentStatusPresentation("Pending").textClass}`}
                >
                  Outstanding
                </Text>
                <Text
                  className={`mt-1 font-ralewayBold text-base ${getPaymentStatusPresentation("Pending").textClass}`}
                >
                  {formatCurrency(Number(ledger?.total_outstanding || 0), 2)}
                </Text>
              </View>

              <View
                className={`min-w-[45%] flex-1 rounded-2xl border p-3.5 shadow-sm shadow-primary/5 ${getPaymentStatusPresentation("Overdue").containerClass}`}
              >
                <Text
                  className={`font-ralewaySemiBold text-[10px] uppercase tracking-wider ${getPaymentStatusPresentation("Overdue").textClass}`}
                >
                  Overdue Arrears
                </Text>
                <Text
                  className={`mt-1 font-ralewayBold text-base ${getPaymentStatusPresentation("Overdue").textClass}`}
                >
                  {formatCurrency(Number(ledger?.total_overdue || 0), 2)}
                </Text>
              </View>
            </View>

            {/* Payments List */}
            <View className="mt-2">
              <Text className="mb-3 font-ralewayBold text-base text-textPrimary">
                Payment Schedule & Ledger Items ({ledger?.payments?.length || 0}
                )
              </Text>

              {!ledger?.payments || ledger.payments.length === 0 ? (
                <View className="items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-panel p-6">
                  <Feather
                    name="calendar"
                    size={28}
                    color={colors.description}
                  />
                  <Text className="mt-2 font-ralewayBold text-sm text-textPrimary">
                    No payment stubs generated yet
                  </Text>
                </View>
              ) : (
                ledger.payments.map((p) => {
                  const status = p.effectiveStatus ?? p.status;
                  const statusStyle = getPaymentStatusPresentation(status);
                  const isPaid = status === "Paid";
                  const isOverdue = status === "Overdue";
                  return (
                    <View
                      key={p.id}
                      className="mb-2.5 rounded-2xl border border-primary/15 bg-panel p-3.5 shadow-sm shadow-primary/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`h-7 w-7 items-center justify-center rounded-lg border ${statusStyle.containerClass}`}
                          >
                            <Ionicons
                              name={
                                isPaid
                                  ? "checkmark"
                                  : isOverdue
                                    ? "alert"
                                    : "time-outline"
                              }
                              size={14}
                              color={palette[statusStyle.iconColor]}
                            />
                          </View>
                          <Text className="font-ralewayBold text-sm text-textPrimary">
                            {p.type}
                          </Text>
                        </View>
                        <Text className="font-ralewayBold text-sm text-textPrimary">
                          {formatCurrency(Number(p.amount || 0), 2)}
                        </Text>
                      </View>

                      <View className="mt-2 flex-row items-center justify-between border-t border-primary/5 pt-2 text-xs">
                        <Text className="font-ralewayMedium text-xs text-description">
                          Due:{" "}
                          {p.due_date || p.dueDate
                            ? formatDate(
                                parseDateValue(
                                  String(p.due_date || p.dueDate).slice(0, 10),
                                ),
                              )
                            : "Not scheduled"}
                        </Text>
                        <Text
                          className={`font-ralewayBold text-xs uppercase ${statusStyle.textClass}`}
                        >
                          {status}
                        </Text>
                      </View>

                      {!isPaid && onRecordPayment ? (
                        <PermissionGate
                          permission="payments.update"
                          propertyId={p.propertyId}
                        >
                          <TouchableOpacity
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            className="mt-2 h-11 items-center justify-center rounded-xl bg-primary/10"
                            onPress={() => {
                              onClose();
                              onRecordPayment(p);
                            }}
                          >
                            <Text className="font-ralewayBold text-xs text-primary">
                              Record Collection
                            </Text>
                          </TouchableOpacity>
                        </PermissionGate>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
