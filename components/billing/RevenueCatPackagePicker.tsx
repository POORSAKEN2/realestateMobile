import { Feather } from "@expo/vector-icons";
import type { PurchasesPackage } from "react-native-purchases";
import { Text, TouchableOpacity, View } from "react-native";

import {
  REVENUECAT_BILLING_PERIOD_LABELS,
  type RevenueCatProductKey,
} from "../../constants/revenueCat";
import { colors } from "../../constants/colors";

export type RevenueCatPackageOption = {
  key: RevenueCatProductKey;
  pkg: PurchasesPackage;
};

function packagePrice(option: RevenueCatPackageOption) {
  const price = option.pkg.product.priceString;
  if (option.key.endsWith("_monthly")) return `${price} / month`;
  if (option.key.endsWith("_yearly")) return `${price} / year`;
  return `${price} once`;
}

export function RevenueCatPackagePicker({
  disabled,
  isLoading,
  onSelect,
  options,
  selectedKey,
}: {
  disabled: boolean;
  isLoading: boolean;
  onSelect: (key: RevenueCatProductKey) => void;
  options: RevenueCatPackageOption[];
  selectedKey: RevenueCatProductKey | null;
}) {
  if (isLoading) {
    return <Text className="text-description">Loading purchase options…</Text>;
  }

  if (!options.length) {
    return (
      <Text accessibilityRole="alert" className="text-danger">
        No store products available. Check RevenueCat offering and store product
        configuration.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <Text className="font-ralewayBold text-sm text-textPrimary">
        Billing option
      </Text>
      {options.map((option) => {
        const isSelected = selectedKey === option.key;

        return (
          <TouchableOpacity
            accessibilityLabel={`${REVENUECAT_BILLING_PERIOD_LABELS[option.key]}, ${packagePrice(option)}`}
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
                {packagePrice(option)}
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
