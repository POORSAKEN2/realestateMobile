import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { Payment } from "../../types";

type PaymentCardProps = {
  payment: Payment;
  onRecordPayment?: (payment: Payment) => void;
  onViewLedger?: (payment: Payment) => void;
};

export function PaymentCard({
  payment,
  onRecordPayment,
  onViewLedger,
}: PaymentCardProps) {
  const isPaid = payment.status === "Paid";
  const isOverdue = payment.status === "Overdue";
  const isPending = payment.status === "Pending";

  const statusBg = isPaid
    ? "bg-success/10 border-success/25"
    : isOverdue
      ? "bg-danger/10 border-danger/25"
      : "bg-warning/10 border-warning/25";

  const statusText = isPaid
    ? "text-success"
    : isOverdue
      ? "text-danger"
      : "text-warning";

  const statusIcon = isPaid
    ? "checkmark-circle-outline"
    : isOverdue
      ? "alert-circle-outline"
      : "time-outline";

  const tenantName =
    payment.lessee?.name ||
    payment.lease?.lessee?.name ||
    "Tenant";

  const propertyTitle =
    payment.property?.title ||
    payment.lease?.property?.title ||
    "Property";

  const formattedAmount = `₱${Number(payment.amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <View className="mb-3 rounded-[24px] border border-primary/15 bg-white p-4 shadow-sm shadow-primary/5">
      {/* Top Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Feather name="dollar-sign" size={16} color={colors.primary} />
          </View>
          <View>
            <Text className="font-ralewayBold text-sm text-textPrimary">
              {payment.type}
            </Text>
            <Text className="font-ralewayMedium text-xs text-description">
              {propertyTitle}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          className={`flex-row items-center rounded-full border px-2.5 py-1 ${statusBg}`}
        >
          <Ionicons
            name={statusIcon as any}
            size={13}
            color={
              isPaid
                ? colors.success
                : isOverdue
                  ? colors.danger
                  : colors.warning
            }
          />
          <Text
            className={`ml-1 font-ralewayBold text-[11px] uppercase tracking-wider ${statusText}`}
          >
            {payment.status}
          </Text>
        </View>
      </View>

      {/* Middle: Amount & Tenant */}
      <View className="my-3 flex-row items-baseline justify-between border-y border-primary/5 py-2.5">
        <View>
          <Text className="font-ralewaySemiBold text-[11px] uppercase tracking-wide text-description">
            Lessee / Resident
          </Text>
          <Text className="font-ralewayBold text-sm text-textPrimary">
            {tenantName}
          </Text>
        </View>

        <View className="items-end">
          <Text className="font-ralewaySemiBold text-[11px] uppercase tracking-wide text-description">
            Amount Due
          </Text>
          <Text className="font-ralewayExtraBold text-lg text-primary">
            {formattedAmount}
          </Text>
        </View>
      </View>

      {/* Dates & Reference */}
      <View className="flex-row items-center justify-between text-xs">
        <View className="flex-row items-center gap-1.5">
          <Feather name="calendar" size={13} color={colors.description} />
          <Text className="font-ralewayMedium text-xs text-description">
            Due: {payment.due_date || payment.dueDate || "N/A"}
          </Text>
        </View>

        {payment.paid_date || payment.paidDate ? (
          <Text className="font-ralewayMedium text-xs text-success">
            Paid on {payment.paid_date || payment.paidDate}
          </Text>
        ) : null}

        {payment.reference_no || payment.referenceNo ? (
          <Text className="font-ralewaySemiBold text-xs text-description">
            Ref: {payment.reference_no || payment.referenceNo}
          </Text>
        ) : null}
      </View>

      {/* Action footer for pending/overdue payments */}
      {!isPaid && onRecordPayment ? (
        <View className="mt-3 flex-row gap-2 pt-2 border-t border-primary/5">
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 h-11 flex-row items-center justify-center rounded-xl bg-primary"
            onPress={() => onRecordPayment(payment)}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
            <Text className="ml-1.5 font-ralewayBold text-xs text-white">
              Record Collection
            </Text>
          </TouchableOpacity>

          {onViewLedger ? (
            <TouchableOpacity
              activeOpacity={0.8}
              className="h-11 px-3.5 items-center justify-center rounded-xl border border-primary/20 bg-primary/5"
              onPress={() => onViewLedger(payment)}
            >
              <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
