import { Feather } from "@expo/vector-icons";
import type { PurchasesPackage } from "react-native-purchases";
import { Text, TouchableOpacity, View } from "react-native";

import {
  REVENUECAT_BILLING_PERIOD_LABELS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import { colors } from "../../constants/colors";
import { formatRevenueCatPackagePrice } from "../../utils/billing/planCatalog";

export type RevenueCatPackageOption = {
  key: RevenueCatProductKey;
  pkg: PurchasesPackage;
};

export function RevenueCatPackagePicker({
  disabled,
  isLoading,
  missingPeriodLabels,
  onSelect,
  onRetry,
  options,
  selectedKey,
}: {
  disabled: boolean;
  isLoading: boolean;
  missingPeriodLabels: string[];
  onSelect: (key: RevenueCatProductKey) => void;
  onRetry: () => void;
  options: RevenueCatPackageOption[];
  selectedKey: RevenueCatProductKey | null;
}) {
  if (isLoading) {
    return <Text className="text-description">Loading purchase options…</Text>;
  }

  if (!options.length) {
    return (
      <View className="gap-2">
        <Text accessibilityRole="alert" className="text-danger">
          No store products are available for this plan.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="self-start rounded-xl border border-primary/20 px-3 py-2"
          disabled={disabled}
          onPress={onRetry}
        >
          <Text className="font-ralewayBold text-xs text-primary">
            Reload purchase options
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="gap-2">
      <Text className="font-ralewayBold text-sm text-textPrimary">
        Billing option
      </Text>
      {missingPeriodLabels.length ? (
        <View className="flex-row items-start justify-between gap-3 rounded-xl bg-warningSurface p-3">
          <Text
            accessibilityRole="alert"
            className="min-w-0 flex-1 text-xs text-textPrimary"
          >
            Some store options are unavailable: {missingPeriodLabels.join(", ")}
            .
          </Text>
          <TouchableOpacity
            accessibilityLabel="Reload missing purchase options"
            accessibilityRole="button"
            disabled={disabled}
            onPress={onRetry}
          >
            <Feather color={colors.primary} name="refresh-cw" size={17} />
          </TouchableOpacity>
        </View>
      ) : null}
      {options.map((option) => {
        const isSelected = selectedKey === option.key;
        const formattedPrice = formatRevenueCatPackagePrice(
          option.key,
          option.pkg,
        );

        return (
          <TouchableOpacity
            accessibilityLabel={`${REVENUECAT_BILLING_PERIOD_LABELS[option.key]}, ${formattedPrice}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            activeOpacity={0.8}
            className={`flex-row items-center justify-between rounded-2xl border p-4 ${
              isSelected
                ? "border-primary bg-primary/10"
                : "border-primary/15 bg-surface"
            }`}
            disabled={disabled}
            key={option.key}
            onPress={() => onSelect(option.key)}
          >
            <View>
              <Text className="font-ralewayBold text-sm text-textPrimary">
                {REVENUECAT_BILLING_PERIOD_LABELS[option.key]}
              </Text>
              <Text className="mt-0.5 font-ralewayMedium text-xs text-description">
                {formattedPrice}
              </Text>
            </View>
            <Feather
              color={colors.primary}
              name={isSelected ? "check-circle" : "circle"}
              size={20}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
