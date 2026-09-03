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

import { colors } from "../../constants/colors";
import { useLeaseLedger } from "../../hooks/api/usePayments";
import type { Payment } from "../../types";
import { ModalHeader } from "../ui/ModalHeader";

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
              <View className="min-w-[45%] flex-1 rounded-2xl border border-primary/15 bg-white p-3.5 shadow-sm shadow-primary/5">
                <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-description">
                  Total Due
                </Text>
                <Text className="mt-1 font-ralewayBold text-base text-textPrimary">
                  ₱
                  {Number(ledger?.total_due || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View className="min-w-[45%] flex-1 rounded-2xl border border-success/20 bg-successSurface p-3.5 shadow-sm shadow-success/5">
                <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-success">
                  Total Paid
                </Text>
                <Text className="mt-1 font-ralewayBold text-base text-success">
                  ₱
                  {Number(ledger?.total_paid || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View className="min-w-[45%] flex-1 rounded-2xl border border-warning/20 bg-warningSurface p-3.5 shadow-sm shadow-warning/5">
                <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-warning">
                  Outstanding
                </Text>
                <Text className="mt-1 font-ralewayBold text-base text-warning">
                  ₱
                  {Number(ledger?.total_outstanding || 0).toLocaleString(
                    "en-PH",
                    { minimumFractionDigits: 2 },
                  )}
                </Text>
              </View>

              <View className="min-w-[45%] flex-1 rounded-2xl border border-danger/20 bg-dangerSurface p-3.5 shadow-sm shadow-danger/5">
                <Text className="font-ralewaySemiBold text-[10px] uppercase tracking-wider text-danger">
                  Overdue Arrears
                </Text>
                <Text className="mt-1 font-ralewayBold text-base text-danger">
                  ₱
                  {Number(ledger?.total_overdue || 0).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
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
                <View className="items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-white p-6">
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
                  const isPaid = p.status === "Paid";
                  const isOverdue = p.status === "Overdue";
                  return (
                    <View
                      key={p.id}
                      className="mb-2.5 rounded-2xl border border-primary/15 bg-white p-3.5 shadow-sm shadow-primary/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`h-7 w-7 items-center justify-center rounded-lg ${
                              isPaid
                                ? "bg-success/15"
                                : isOverdue
                                  ? "bg-danger/15"
                                  : "bg-warning/15"
                            }`}
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
                              color={
                                isPaid
                                  ? colors.success
                                  : isOverdue
                                    ? colors.danger
                                    : colors.warning
                              }
                            />
                          </View>
                          <Text className="font-ralewayBold text-sm text-textPrimary">
                            {p.type}
                          </Text>
                        </View>
                        <Text className="font-ralewayBold text-sm text-textPrimary">
                          ₱
                          {Number(p.amount || 0).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </View>

                      <View className="mt-2 flex-row items-center justify-between border-t border-primary/5 pt-2 text-xs">
                        <Text className="font-ralewayMedium text-xs text-description">
                          Due: {p.due_date || p.dueDate}
                        </Text>
                        <Text
                          className={`font-ralewayBold text-xs uppercase ${
                            isPaid
                              ? "text-success"
                              : isOverdue
                                ? "text-danger"
                                : "text-warning"
                          }`}
                        >
                          {p.status}
                        </Text>
                      </View>

                      {!isPaid && onRecordPayment ? (
                        <PermissionGate permission="payments.create"><TouchableOpacity
                          activeOpacity={0.8}
                          className="mt-2 h-9 items-center justify-center rounded-xl bg-primary/10"
                          onPress={() => {
                            onClose();
                            onRecordPayment(p);
                          }}
                        >
                          <Text className="font-ralewayBold text-xs text-primary">
                            Record Payment
                          </Text>
                        </TouchableOpacity></PermissionGate>
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
