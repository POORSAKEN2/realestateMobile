import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { REVENUECAT_PRODUCT_LABELS } from "../../constants/revenueCat";
import { colors } from "../../constants/colors";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { useSnackbar } from "../../hooks/useSnackbar";
import { PAYWALL_RESULT } from "../../services/billing/revenueCatUi";
import {
  getActiveRevenueCatProductId,
  getRevenueCatProductKey,
} from "../../utils/billing/revenueCatCustomer";
import { Snackbar } from "../ui/Snackbar";

type RevenueCatAction = "customer-center" | "paywall" | "restore";

function ActionButton({
  busy,
  icon,
  label,
  onPress,
  primary = false,
}: {
  busy: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      activeOpacity={0.8}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border px-4 ${
        primary ? "border-primary bg-primary" : "border-primary/20 bg-white"
      }`}
      disabled={busy}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator
          color={primary ? colors.whitePrimary : colors.primary}
          size="small"
        />
      ) : (
        <Feather
          color={primary ? colors.whitePrimary : colors.primary}
          name={icon}
          size={17}
        />
      )}
      <Text
        className={`font-ralewayExtraBold text-sm ${
          primary ? "text-white" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function RevenueCatSubscriptionCard({
  canManagePurchases,
}: {
  canManagePurchases: boolean;
}) {
  const {
    customerInfo,
    error,
    isLoading,
    isPremium,
    isReady,
    presentCustomerCenter,
    presentPaywallIfNeeded,
    restorePurchases,
  } = useRevenueCat();
  const snackbar = useSnackbar();
  const [activeAction, setActiveAction] = useState<RevenueCatAction | null>(
    null,
  );
  const productKey = getRevenueCatProductKey(
    getActiveRevenueCatProductId(customerInfo),
  );
  const hasPurchaseHistory = Boolean(
    customerInfo?.activeSubscriptions.length ||
    customerInfo?.allPurchasedProductIdentifiers.length,
  );
  const statusDescription = useMemo(() => {
    if (isPremium && productKey) {
      return `${REVENUECAT_PRODUCT_LABELS[productKey]} access is active.`;
    }
    if (isPremium) return "Terrane Premium access is active.";
    return "Choose Lifetime, Yearly, or Monthly access in the secure paywall.";
  }, [isPremium, productKey]);

  async function runAction(
    action: RevenueCatAction,
    operation: () => Promise<void>,
  ) {
    if (activeAction) return;
    setActiveAction(action);
    try {
      await operation();
    } catch (cause) {
      Alert.alert(
        "Subscription unavailable",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  function showPaywall() {
    void runAction("paywall", async () => {
      const result = await presentPaywallIfNeeded();
      if (result === PAYWALL_RESULT.ERROR) {
        throw new Error("Paywall could not complete the request.");
      }
      if (result === PAYWALL_RESULT.PURCHASED) {
        snackbar.show("Terrane Premium purchase complete.");
      } else if (result === PAYWALL_RESULT.RESTORED) {
        snackbar.show("Purchases restored.");
      } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        snackbar.show("Terrane Premium is already active.");
      }
    });
  }

  function restore() {
    void runAction("restore", async () => {
      const restored = await restorePurchases();
      const premiumRestored = Boolean(
        restored.entitlements.active.terrane_premium,
      );
      snackbar.show(
        premiumRestored
          ? "Terrane Premium restored."
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
    <View className="gap-4 rounded-[28px] border border-primary/15 bg-white p-5 shadow-sm shadow-primary/5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent/30">
          <Feather name="star" color={colors.primary} size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-ralewayExtraBold text-base text-textPrimary">
              Terrane Premium
            </Text>
            <View
              className={`rounded-full px-3 py-1 ${
                isPremium ? "bg-success/10" : "bg-surface"
              }`}
            >
              <Text
                className={`font-ralewayBold text-[10px] uppercase ${
                  isPremium ? "text-success" : "text-description"
                }`}
              >
                {isPremium ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <Text className="mt-1 font-ralewayMedium text-xs leading-5 text-description">
            {statusDescription}
          </Text>
        </View>
      </View>

      {error ? (
        <Text accessibilityRole="alert" className="text-xs text-danger">
          {error}
        </Text>
      ) : null}

      {canManagePurchases ? (
        <>
          <ActionButton
            busy={activeAction === "paywall" || (isLoading && !isReady)}
            icon="credit-card"
            label={isPremium ? "View premium access" : "View premium plans"}
            onPress={showPaywall}
            primary
          />

          <View className="gap-3 sm:flex-row">
            <View className="flex-1">
              <ActionButton
                busy={activeAction === "restore"}
                icon="refresh-cw"
                label="Restore purchases"
                onPress={restore}
              />
            </View>
            {hasPurchaseHistory ? (
              <View className="flex-1">
                <ActionButton
                  busy={activeAction === "customer-center"}
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
