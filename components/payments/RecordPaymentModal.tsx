import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchLeaseOptionsPage } from "../../api/leases";
import { useAccess } from "../../hooks/auth/useAccess";
import { ActionSheet } from "../ui/ActionSheet";
import type { CollectPaymentPayload } from "../../types/domain/payments";
import React, { useEffect, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { useWorkspacePresentation } from "../../context/WorkspacePresentationContext";
import { AddEditModal } from "../ui/AddEditModal";
import type { Payment, PaymentType, RecordPaymentPayload } from "../../types";
import { PickerField } from "../ui/fields/PickerField";
import { DateTimePickerModal } from "../ui/fields/DateTimePickerModal";
import {
  formatDateValue,
  parseDateValue,
} from "../../utils/expenses/expenseForm";
import { formatDate } from "../../utils/formatters";

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
  onCollect: (payload: CollectPaymentPayload) => Promise<void>;
  prefillPayment?: Payment | null;
  defaultLeaseId?: string;
};

export function RecordPaymentModal({
  isVisible,
  onClose,
  onSubmit,
  onCollect,
  isPending,
  prefillPayment,
  defaultLeaseId,
}: RecordPaymentModalProps) {
  const submissionPending = useRef(false);
  const { can } = useAccess();
  const [leaseId, setLeaseId] = useState(defaultLeaseId ?? "");
  const [leasePickerOpen, setLeasePickerOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [dateTarget, setDateTarget] = useState<"paid" | "due">("paid");
  const leases = useInfiniteQuery({
    queryKey: ["leases", "collection-options"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchLeaseOptionsPage(pageParam),
    enabled: isVisible && !prefillPayment && can("leases.viewAny"),
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === 15 ? lastPageParam + 1 : undefined,
  });
  const leaseOptions = leases.data?.pages.flat() ?? [];
  const selectedLease = leaseOptions.find((lease) => lease.id === leaseId);
  const { settings } = useWorkspacePresentation();
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("Rent");
  const [paidDate, setPaidDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDatePickerOpen(false);
    setLeasePickerOpen(false);
    if (isVisible) {
      setLeaseId(defaultLeaseId ?? "");
      setDueDate(formatDateValue(new Date()));
      if (prefillPayment) {
        setNotes(prefillPayment.notes ?? "");
        setAmount(String(prefillPayment.amount ?? ""));
        setPaymentType(prefillPayment.type || "Rent");
        setReferenceNo(
          prefillPayment.reference_no || prefillPayment.referenceNo || "",
        );
        setPaidDate(formatDateValue(new Date()));
      } else {
        setAmount("");
        setPaymentType("Rent");
        setReferenceNo("");
        setPaidDate(formatDateValue(new Date()));
        setNotes("");
      }
      setError(null);
    }
  }, [isVisible, prefillPayment, defaultLeaseId]);

  async function handleSubmit() {
    if (submissionPending.current || isPending) return;
    const numericAmount = Number(amount.trim().replace(/,/g, ""));
    if (
      !Number.isFinite(numericAmount) ||
      (prefillPayment ? numericAmount < 0 : numericAmount <= 0)
    ) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (!prefillPayment && !leaseId) {
      setError("Please specify the lease associated with this payment.");
      return;
    }

    setError(null);
    submissionPending.current = true;
    try {
      const receipt = {
        paid_date: paidDate || formatDateValue(new Date()),
        reference_no: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (prefillPayment) await onCollect(receipt);
      else
        await onSubmit({
          lease_id: leaseId,
          amount: numericAmount,
          type: paymentType,
          due_date: dueDate,
          ...receipt,
          status: "Paid",
        });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record payment.",
      );
    } finally {
      submissionPending.current = false;
    }
  }

  return (
    <AddEditModal
      permission={prefillPayment ? "payments.update" : "payments.create"}
      propertyId={prefillPayment?.propertyId}
      formError={error}
      isPending={isPending}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText={prefillPayment ? "Record Collection" : "Record Payment"}
      subtitle={
        prefillPayment?.property?.title ||
        prefillPayment?.lease?.property?.title
          ? `For ${prefillPayment?.property?.title || prefillPayment?.lease?.property?.title}`
          : "Record rent or deposit transaction"
      }
      title={prefillPayment ? "Record Collection" : "Record Payment"}
    >
      <View className="gap-5">
        {!prefillPayment ? (
          <>
            <PickerField
              label="Lease"
              required
              iconName="document-text-outline"
              disabled={isPending || leases.isLoading}
              value={
                selectedLease
                  ? `${selectedLease.property?.title || "Lease"} · ${selectedLease.lessee?.name || "Tenant"}`
                  : undefined
              }
              placeholder={
                leases.isLoading ? "Loading leases…" : "Select lease"
              }
              onPress={() => setLeasePickerOpen(true)}
            />
            {leases.isError ? (
              <TouchableOpacity onPress={() => leases.refetch()}>
                <Text className="text-danger">
                  Could not load leases. Retry
                </Text>
              </TouchableOpacity>
            ) : null}
            <ActionSheet
              title="Select lease"
              visible={leasePickerOpen}
              onClose={() => setLeasePickerOpen(false)}
              subtitle={
                leaseOptions.length
                  ? "Choose an accessible lease"
                  : "No accessible leases available"
              }
              actions={[
                ...leaseOptions.map((lease) => ({
                  icon: "file-document-outline" as const,
                  label: `${lease.property?.title || "Lease"} · ${lease.lessee?.name || "Tenant"}`,
                  description: `${lease.startDate} – ${lease.endDate}`,
                  selected: lease.id === leaseId,
                  onPress: () => setLeaseId(lease.id),
                })),
                ...(leases.hasNextPage
                  ? [
                      {
                        icon: "chevron-down" as const,
                        label: leases.isFetchingNextPage
                          ? "Loading…"
                          : "Load more leases",
                        disabled: leases.isFetchingNextPage,
                        dismissOnPress: false,
                        onPress: () => {
                          void leases.fetchNextPage();
                        },
                      },
                    ]
                  : []),
              ]}
            />
          </>
        ) : null}
        {/* Payment Amount */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Payment Amount ({settings.currency}) *
          </Text>
          <View className="h-14 flex-row items-center rounded-2xl border border-primary/20 bg-panel px-4">
            <TextInput
              accessibilityLabel="Payment amount"
              className="flex-1 font-ralewayBold text-lg text-textPrimary"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.description}
              value={amount}
              editable={!prefillPayment && !isPending}
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
                      : "border-primary/20 bg-panel"
                  }`}
                  disabled={Boolean(prefillPayment) || isPending}
                  accessibilityState={{
                    disabled: Boolean(prefillPayment) || isPending,
                  }}
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

        {!prefillPayment ? (
          <PickerField
            label="Due date"
            required
            placeholder="Select due date"
            disabled={isPending}
            value={dueDate ? formatDate(parseDateValue(dueDate)) : undefined}
            onPress={() => {
              setDateTarget("due");
              setDatePickerOpen(true);
            }}
          />
        ) : (
          <Text className="text-sm text-description">
            Full settlement. Amount and category stay unchanged.
          </Text>
        )}
        {/* Paid Date */}
        <PickerField
          label="Payment date"
          placeholder="Select payment date"
          required
          disabled={isPending}
          value={paidDate ? formatDate(parseDateValue(paidDate)) : undefined}
          onPress={() => {
            setDateTarget("paid");
            setDatePickerOpen(true);
          }}
        />
        {isVisible && datePickerOpen ? (
          <DateTimePickerModal
            mode="date"
            title="Select payment date"
            value={parseDateValue(dateTarget === "due" ? dueDate : paidDate)}
            onClose={() => setDatePickerOpen(false)}
            onConfirm={(date) => {
              if (dateTarget === "due") setDueDate(formatDateValue(date));
              else setPaidDate(formatDateValue(date));
              setDatePickerOpen(false);
            }}
          />
        ) : null}

        {/* Reference Number */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Reference / Transaction No. (Optional)
          </Text>
          <View className="h-14 justify-center rounded-2xl border border-primary/20 bg-panel px-4">
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
          <View className="h-24 rounded-2xl border border-primary/20 bg-panel p-3">
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
