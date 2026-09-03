import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { AddEditModal } from "../ui/AddEditModal";
import type { Payment, PaymentType, RecordPaymentPayload } from "../../types";

const PAYMENT_TYPES: PaymentType[] = [
  "Rent",
  "Deposit",
  "Downpayment",
  "Late Fee",
  "Other",
];

type RecordPaymentModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => Promise<void>;
  isPending: boolean;
  prefillPayment?: Payment | null;
  defaultLeaseId?: string;
};

export function RecordPaymentModal({
  isVisible,
  onClose,
  onSubmit,
  isPending,
  prefillPayment,
  defaultLeaseId,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("Rent");
  const [paidDate, setPaidDate] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      if (prefillPayment) {
        setAmount(String(prefillPayment.amount || ""));
        setPaymentType(prefillPayment.type || "Rent");
        setReferenceNo(prefillPayment.reference_no || prefillPayment.referenceNo || "");
        setPaidDate(new Date().toISOString().split("T")[0]);
      } else {
        setAmount("");
        setPaymentType("Rent");
        setReferenceNo("");
        setPaidDate(new Date().toISOString().split("T")[0]);
        setNotes("");
      }
      setError(null);
    }
  }, [isVisible, prefillPayment]);

  async function handleSubmit() {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    const leaseId =
      prefillPayment?.lease_id ||
      prefillPayment?.leaseId ||
      defaultLeaseId;

    if (!leaseId) {
      setError("Please specify the lease associated with this payment.");
      return;
    }

    setError(null);
    try {
      await onSubmit({
        lease_id: leaseId,
        amount: numericAmount,
        type: paymentType,
        paid_date: paidDate || new Date().toISOString().split("T")[0],
        status: "Paid",
        reference_no: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    }
  }

  return (
    <AddEditModal permission="payments.create"
      formError={error}
      isPending={isPending}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Record Payment"
      subtitle={
        prefillPayment?.property?.title ||
        prefillPayment?.lease?.property?.title
          ? `For ${prefillPayment?.property?.title || prefillPayment?.lease?.property?.title}`
          : "Record rent or deposit transaction"
      }
      title="Record Payment"
    >
      <View className="gap-5">
        {/* Payment Amount */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Payment Amount (PHP ₱) *
          </Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-primary/20 bg-white px-4">
            <Text className="font-ralewayBold text-lg text-primary">₱</Text>
            <TextInput
              accessibilityLabel="Payment amount"
              className="ml-2 flex-1 font-ralewayBold text-lg text-textPrimary"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.description}
              value={amount}
            />
          </View>
        </View>

        {/* Payment Type Selector */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Payment Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PAYMENT_TYPES.map((type) => {
              const isSelected = paymentType === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  className={`rounded-xl border px-3.5 py-2.5 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-primary/20 bg-white"
                  }`}
                  onPress={() => setPaymentType(type)}
                >
                  <Text
                    className={`font-ralewayBold text-xs ${
                      isSelected ? "text-white" : "text-textPrimary"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Paid Date */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Payment Date (YYYY-MM-DD)
          </Text>
          <View className="h-14 justify-center rounded-2xl border border-primary/20 bg-white px-4">
            <TextInput
              accessibilityLabel="Payment Date"
              className="font-ralewayBold text-base text-textPrimary"
              onChangeText={setPaidDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.description}
              value={paidDate}
            />
          </View>
        </View>

        {/* Reference Number */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Reference / Transaction No. (Optional)
          </Text>
          <View className="h-14 justify-center rounded-2xl border border-primary/20 bg-white px-4">
            <TextInput
              accessibilityLabel="Reference Number"
              className="font-ralewayBold text-base text-textPrimary"
              onChangeText={setReferenceNo}
              placeholder="e.g. GCash Ref / Bank Ref"
              placeholderTextColor={colors.description}
              value={referenceNo}
            />
          </View>
        </View>

        {/* Notes */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Notes / Remarks (Optional)
          </Text>
          <View className="h-24 rounded-2xl border border-primary/20 bg-white p-3">
            <TextInput
              accessibilityLabel="Notes"
              className="flex-1 font-ralewayMedium text-sm text-textPrimary"
              multiline
              onChangeText={setNotes}
              placeholder="Additional details..."
              placeholderTextColor={colors.description}
              textAlignVertical="top"
              value={notes}
            />
          </View>
        </View>
      </View>
    </AddEditModal>
  );
}
