import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { AddEditModal } from "../ui/AddEditModal";
import type { Lease } from "../../types";

type LeaseRenewalModalProps = {
  isVisible: boolean;
  onClose: () => void;
  lease: Lease | null;
  onSubmit: (leaseId: string, payload: {
    end_date?: string;
    term_length_months?: number;
    monthly_rent?: number;
  }) => Promise<void>;
  isPending: boolean;
};

export function LeaseRenewalModal({
  isVisible,
  onClose,
  lease,
  onSubmit,
  isPending,
}: LeaseRenewalModalProps) {
  const [termMonths, setTermMonths] = useState("12");
  const [newRent, setNewRent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && lease) {
      setTermMonths("12");
      setNewRent(String(lease.monthlyRent || ""));
      setError(null);
    }
  }, [isVisible, lease]);

  const currentRent = Number(lease?.monthlyRent || 0);
  const enteredRent = parseFloat(newRent) || currentRent;
  const escalationPercent =
    currentRent > 0
      ? (((enteredRent - currentRent) / currentRent) * 100).toFixed(1)
      : "0";

  async function handleSubmit() {
    if (!lease?.id) return;

    const months = parseInt(termMonths, 10);
    if (isNaN(months) || months <= 0) {
      setError("Please enter a valid renewal term in months.");
      return;
    }

    const rent = parseFloat(newRent);
    if (isNaN(rent) || rent <= 0) {
      setError("Please enter a valid monthly rent amount.");
      return;
    }

    setError(null);
    try {
      await onSubmit(lease.id, {
        term_length_months: months,
        monthly_rent: rent,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew lease.");
    }
  }

  return (
    <AddEditModal
      formError={error}
      isPending={isPending}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Renew Lease"
      subtitle={`Renew contract for ${lease?.lessee?.name || "Tenant"}`}
      title="Renew Lease Contract"
    >
      <View className="gap-5">
        {/* Summary of Current Lease */}
        <View className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-ralewayBold text-xs text-description uppercase">
              Current Contract Term
            </Text>
            <Text className="font-ralewayBold text-xs text-primary">
              Expires {lease?.endDate}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between border-t border-primary/10 pt-2">
            <Text className="font-ralewayMedium text-sm text-textPrimary">
              Current Monthly Rent:
            </Text>
            <Text className="font-ralewayBold text-sm text-textPrimary">
              ₱{currentRent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Renewal Term Length in Months */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Renewal Term Length (Months) *
          </Text>
          <View className="flex-row gap-2">
            {["6", "12", "24"].map((preset) => {
              const isSelected = termMonths === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  activeOpacity={0.8}
                  className={`flex-1 items-center justify-center rounded-xl border py-3 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-primary/20 bg-white"
                  }`}
                  onPress={() => setTermMonths(preset)}
                >
                  <Text
                    className={`font-ralewayBold text-sm ${
                      isSelected ? "text-white" : "text-textPrimary"
                    }`}
                  >
                    {preset} Mos
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="mt-1 h-14 justify-center rounded-2xl border border-primary/20 bg-white px-4">
            <TextInput
              accessibilityLabel="Custom term length"
              className="font-ralewayBold text-base text-textPrimary"
              keyboardType="number-pad"
              onChangeText={setTermMonths}
              placeholder="Or enter custom months"
              placeholderTextColor={colors.description}
              value={termMonths}
            />
          </View>
        </View>

        {/* New Monthly Rent & Escalation */}
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
              New Monthly Rent (PHP ₱) *
            </Text>
            {Number(escalationPercent) !== 0 ? (
              <Text
                className={`font-ralewayBold text-xs ${
                  Number(escalationPercent) > 0 ? "text-success" : "text-danger"
                }`}
              >
                {Number(escalationPercent) > 0 ? `+${escalationPercent}%` : `${escalationPercent}%`} escalation
              </Text>
            ) : null}
          </View>

          <View className="h-14 flex-row items-center rounded-2xl border border-primary/20 bg-white px-4">
            <Text className="font-ralewayBold text-lg text-primary">₱</Text>
            <TextInput
              accessibilityLabel="New monthly rent"
              className="ml-2 flex-1 font-ralewayBold text-lg text-textPrimary"
              keyboardType="decimal-pad"
              onChangeText={setNewRent}
              placeholder="0.00"
              placeholderTextColor={colors.description}
              value={newRent}
            />
          </View>
        </View>
      </View>
    </AddEditModal>
  );
}
