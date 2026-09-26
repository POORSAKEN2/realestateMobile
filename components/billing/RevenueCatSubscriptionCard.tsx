import { Feather } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";

import { REVENUECAT_PRODUCT_LABELS } from "../../constants/revenueCat";
import { colors } from "../../constants/colors";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { useSnackbar } from "../../hooks/useSnackbar";
import type { BillingEntitlement } from "../../types/domain/billing";
import { BillingActionButton } from "./BillingActionButton";
import { BillingSummaryRow } from "./BillingSummaryRow";
import {
  getBillingAccountState,
  getBillingStoreStatus,
} from "../../utils/billing/billingAccountState";
import {
  getActiveRevenueCatProductId,
  getRevenueCatProductKey,
  hasActiveRevenueCatSubscription,
  hasRevenueCatLifetimeAccess,
  hasRevenueCatPremium,
  hasRevenueCatPurchaseHistory,
} from "../../utils/billing/revenueCatCustomer";
import { Snackbar } from "../ui/Snackbar";

type RevenueCatAction = "customer-center" | "restore";

export function RevenueCatSubscriptionCard({
  canManagePurchases,
  entitlement,
  onViewPlans,
}: {
  canManagePurchases: boolean;
  entitlement?: BillingEntitlement | null;
  onViewPlans: () => void;
}) {
  const {
    customerInfo,
    error,
    isLoading,
    isPremium,
    isReady,
    presentCustomerCenter,
    restorePurchases,
    serverSyncStatus,
  } = useRevenueCat();
  const snackbar = useSnackbar();
  const [activeAction, setActiveAction] = useState<RevenueCatAction | null>(
    null,
  );
  const actionBusy = useRef(false);
  const actionsDisabled = activeAction !== null || (isLoading && !isReady);
  const storeStatus = getBillingStoreStatus(customerInfo, { isLoading, error });
  const productKey = getRevenueCatProductKey(
    getActiveRevenueCatProductId(customerInfo),
  );
  const hasPurchaseHistory = hasRevenueCatPurchaseHistory(customerInfo);
  const hasActiveSubscription = hasActiveRevenueCatSubscription(customerInfo);
  const hasLifetimeAccess = hasRevenueCatLifetimeAccess(customerInfo);
  const billingState = useMemo(
    () => getBillingAccountState(entitlement, customerInfo),
    [customerInfo, entitlement],
  );
  const statusDescription = customerInfo
    ? isPremium
      ? `Your store account owns ${productKey ? REVENUECAT_PRODUCT_LABELS[productKey] : billingState.storeLabel}${hasLifetimeAccess ? ", a lifetime purchase" : ""}. App access is confirmed separately by the server.`
      : "Choose Starter, Professional or Portfolio with secure in-app purchase."
    : "Store status has not been confirmed. Refresh to check purchases and prices.";

  async function runAction(
    action: RevenueCatAction,
    operation: () => Promise<void>,
  ) {
    if (actionBusy.current) return;
    actionBusy.current = true;
    setActiveAction(action);
    try {
      await operation();
    } catch (cause) {
      Alert.alert(
        "Subscription unavailable",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    } finally {
      actionBusy.current = false;
      setActiveAction(null);
    }
  }

  function restore() {
    void runAction("restore", async () => {
      const restored = await restorePurchases();
      const premiumRestored = hasRevenueCatPremium(restored);
      snackbar.show(
        premiumRestored
          ? "Store purchase restored. Server access is being checked."
          : "No Terrane Premium purchase found for this store account.",
      );
    });
  }

  function openCustomerCenter() {
    void runAction("customer-center", async () => {
      await presentCustomerCenter();
    });
  }

  return (
    <View className="gap-4 rounded-[28px] border border-primary/20 bg-panel p-5 shadow-sm shadow-primary/5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent/30">
          <Feather name="star" color={colors.primary} size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="font-ralewayExtraBold text-base text-textPrimary">
              Store purchase
            </Text>
            <View
              className={`rounded-full px-3 py-1 ${
                storeStatus.tone === "success"
                  ? "bg-success/10"
                  : storeStatus.tone === "warning"
                    ? "bg-warningSurface"
                    : "bg-surface"
              }`}
            >
              <Text
                className={`font-ralewayBold text-[10px] uppercase ${
                  storeStatus.tone === "success"
                    ? "text-success"
                    : storeStatus.tone === "warning"
                      ? "text-warning"
                      : "text-description"
                }`}
              >
                {storeStatus.label}
              </Text>
            </View>
          </View>
          <Text className="mt-1 font-ralewayMedium text-xs leading-5 text-description">
            {statusDescription}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl bg-surface px-4 py-2">
        <BillingSummaryRow
          label="Server access"
          value={billingState.serverLabel}
        />
        <BillingSummaryRow
          label="Store purchase"
          value={billingState.storeLabel}
        />
      </View>

      {billingState.syncRequired ? (
        <View className="flex-row items-start gap-2 rounded-2xl bg-warningSurface p-4">
          <Feather name="alert-circle" color={colors.danger} size={18} />
          <Text
            accessibilityRole="alert"
            className="min-w-0 flex-1 text-xs leading-5 text-textPrimary"
          >
            {entitlement
              ? `Your store purchase is active, but protected app access still uses the ${billingState.serverLabel} plan.`
              : "Your store purchase is active. Server access could not be confirmed; retry the plan refresh."}{" "}
            {serverSyncStatus === "delayed"
              ? "Immediate verification is delayed; webhook and scheduled retries remain active."
              : serverSyncStatus === "syncing"
                ? "Server verification is running; upgraded features unlock after confirmation."
                : "Refresh to check server access. Upgraded features require server confirmation."}
          </Text>
        </View>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-danger">
          {error}
        </Text>
      ) : null}

      {canManagePurchases ? (
        <>
          <BillingActionButton
            disabled={actionsDisabled}
            isLoading={activeAction === "customer-center"}
            icon="credit-card"
            label={
              hasLifetimeAccess
                ? "View purchase support"
                : hasActiveSubscription
                  ? "Manage subscription"
                  : isPremium
                    ? "Manage purchase"
                    : "View premium plans"
            }
            onPress={isPremium ? openCustomerCenter : onViewPlans}
            primary
          />

          <View className="gap-3 sm:flex-row">
            <View className="flex-1">
              <BillingActionButton
                disabled={actionsDisabled}
                isLoading={activeAction === "restore"}
                icon="refresh-cw"
                label="Restore purchases"
                onPress={restore}
              />
            </View>
            {hasPurchaseHistory && !isPremium ? (
              <View className="flex-1">
                <BillingActionButton
                  disabled={actionsDisabled}
                  isLoading={activeAction === "customer-center"}
                  icon="settings"
                  label="Manage purchase"
                  onPress={openCustomerCenter}
                />
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <Text className="font-ralewayMedium text-xs leading-5 text-description">
          Ask your account administrator to buy, restore, or manage this
          organization subscription.
        </Text>
      )}

      {snackbar.isVisible ? (
        <Snackbar message={snackbar.message} onDismiss={snackbar.dismiss} />
      ) : null}
    </View>
  );
}
