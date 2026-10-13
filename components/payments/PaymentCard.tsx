import { PermissionGate } from "../auth/PermissionGate";
import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { getPaymentStatusPresentation } from "../../constants/paymentStatusPresentation";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { parseDateValue } from "../../utils/expenses/expenseForm";
import type { Payment } from "../../types";
import { formatCurrency, formatDate } from "../../utils/formatters";

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
  const status = payment.effectiveStatus ?? payment.status;
  const isPaid = status === "Paid";
  const isOverdue = status === "Overdue";
  const palette = useThemeColors();
  const statusStyle = getPaymentStatusPresentation(status);

  const statusIcon = isPaid
    ? "checkmark-circle-outline"
    : isOverdue
      ? "alert-circle-outline"
      : "time-outline";

  const tenantName =
    payment.lessee?.name || payment.lease?.lessee?.name || "Tenant";

  const propertyTitle =
    payment.property?.title || payment.lease?.property?.title || "Property";

  const dueDate = payment.due_date || payment.dueDate;
  const formattedAmount = formatCurrency(Number(payment.amount || 0), 2);

  return (
    <View className="mb-3 rounded-[24px] border border-primary/15 bg-panel p-4 shadow-sm shadow-primary/5">
      {/* Top Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-iconSurface">
            <Feather name="dollar-sign" size={16} color={palette.primary} />
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
          className={`flex-row items-center rounded-full border px-2.5 py-1 ${statusStyle.containerClass}`}
        >
          <Ionicons
            name={statusIcon as any}
            size={13}
            color={palette[statusStyle.iconColor]}
          />
          <Text
            className={`ml-1 font-ralewayBold text-[11px] uppercase tracking-wider ${statusStyle.textClass}`}
          >
            {status}
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
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-1.5">
          <Feather name="calendar" size={13} color={palette.description} />
          <Text className="font-ralewayMedium text-xs text-description">
            Due:{" "}
            {dueDate
              ? formatDate(parseDateValue(String(dueDate).slice(0, 10)))
              : "Not scheduled"}
          </Text>
        </View>

        {payment.paid_date || payment.paidDate ? (
          <Text className="font-ralewayMedium text-xs text-success">
            Paid on{" "}
            {formatDate(
              parseDateValue(
                String(payment.paid_date || payment.paidDate).slice(0, 10),
              ),
            )}
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
        <View className="mt-3 flex-row gap-2 border-t border-primary/5 pt-2">
          <PermissionGate
            permission="payments.update"
            propertyId={payment.propertyId}
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Record collection for ${tenantName}`}
              activeOpacity={0.8}
              className="h-11 flex-1 flex-row items-center justify-center rounded-xl bg-primary"
              onPress={() => onRecordPayment(payment)}
            >
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text className="ml-1.5 font-ralewayBold text-xs text-white">
                Record Collection
              </Text>
            </TouchableOpacity>
          </PermissionGate>

          {onViewLedger ? (
            <PermissionGate
              permission="leases.view"
              propertyId={payment.propertyId}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`View ledger for ${tenantName}`}
                activeOpacity={0.8}
                className="h-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 px-3.5"
                onPress={() => onViewLedger(payment)}
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={palette.primary}
                />
              </TouchableOpacity>
            </PermissionGate>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
