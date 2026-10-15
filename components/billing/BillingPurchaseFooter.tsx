import { Text, View } from "react-native";
import { REVENUECAT_BILLING_PERIOD_LABELS } from "../../constants/revenueCat";
import { formatRevenueCatPackagePrice } from "../../utils/billing/planCatalog";
import { BillingActionButton } from "./BillingActionButton";
import { ModalActionFooter } from "../ui/ModalActionFooter";
import type { RevenueCatPackageOption } from "./RevenueCatPackagePicker";

type BillingPurchaseFooterProps = {
  tierLabel: string;
  option?: RevenueCatPackageOption;
  disabled: boolean;
  pendingLabel?: string;
  onPurchase: () => void;
};

export function BillingPurchaseFooter({
  tierLabel,
  option,
  disabled,
  pendingLabel,
  onPurchase,
}: BillingPurchaseFooterProps) {
  const periodLabel = option
    ? REVENUECAT_BILLING_PERIOD_LABELS[option.key]
    : null;
  const renewal = option?.key.endsWith("_monthly")
    ? "Renews monthly until canceled."
    : option?.key.endsWith("_yearly")
      ? "Renews yearly until canceled."
      : null;

  return (
    <ModalActionFooter>
      <View className="gap-2">
        <Text
          accessibilityLiveRegion="polite"
          className="font-ralewaySemiBold text-sm text-textPrimary"
        >
          {tierLabel}
          {periodLabel ? ` · ${periodLabel}` : ""}
        </Text>
        <BillingActionButton
          label={
            pendingLabel ??
            (option
              ? `Purchase ${formatRevenueCatPackagePrice(option.key, option.pkg)}`
              : "Purchase unavailable")
          }
          disabled={disabled || !option}
          isLoading={Boolean(pendingLabel)}
          onPress={onPurchase}
          strong
        />
        {renewal ? (
          <Text className="text-center font-ralewayMedium text-xs leading-5 text-description">
            {renewal}
          </Text>
        ) : null}
      </View>
    </ModalActionFooter>
  );
}
