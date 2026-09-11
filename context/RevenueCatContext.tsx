import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import type { PAYWALL_RESULT } from "react-native-purchases-ui";

import { BILLING_ENTITLEMENT_QUERY_KEY } from "../hooks/api/useBillingEntitlement";
import type { RevenueCatProductKey } from "../constants/revenueCat";
import { useAuth } from "../hooks/useAuth";
import {
  configureRevenueCat,
  getRevenueCatSnapshot,
  identifyRevenueCatCustomer,
  isRevenueCatCancellation,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  toRevenueCatClientError,
} from "../services/billing/revenueCatClient";
import {
  presentRevenueCatCustomerCenter,
  presentRevenueCatPaywall,
  presentRevenueCatPaywallIfNeeded,
} from "../services/billing/revenueCatUi";
import {
  hasRevenueCatPremium,
  indexRevenueCatPackages,
} from "../utils/billing/revenueCatCustomer";

type RevenueCatIdentity = {
  appUserId: string;
  email: string | null;
};

type RevenueCatContextValue = {
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  error: string | null;
  isLoading: boolean;
  isPremium: boolean;
  isReady: boolean;
  packages: Record<RevenueCatProductKey, PurchasesPackage | null>;
  presentCustomerCenter: () => Promise<void>;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  refresh: () => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo>;
};

export const RevenueCatContext = createContext<
  RevenueCatContextValue | undefined
>(undefined);

function getRevenueCatIdentity(user: unknown): RevenueCatIdentity | null {
  if (typeof user !== "object" || user === null) return null;
  const record = user as Record<string, unknown>;
  const rawTenantId = record.tenant_id ?? record.tenantId;
  if (typeof rawTenantId !== "string" && typeof rawTenantId !== "number") {
    return null;
  }

  const appUserId = String(rawTenantId).trim();
  if (!appUserId) return null;

  return {
    appUserId,
    email:
      typeof record.email === "string" ? record.email.trim() || null : null,
  };
}

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const { isLoading: isAuthLoading, session } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const identity = useMemo(
    () => getRevenueCatIdentity(session?.user),
    [session?.user],
  );

  const updateCustomerInfo = useCallback(
    (nextCustomerInfo: CustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: BILLING_ENTITLEMENT_QUERY_KEY,
      });
    },
    [queryClient],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const snapshot = await getRevenueCatSnapshot();
      setCurrentOffering(snapshot.currentOffering);
      updateCustomerInfo(snapshot.customerInfo);
      return snapshot.customerInfo;
    } catch (cause) {
      const nextError = toRevenueCatClientError(cause);
      setError(nextError.message);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, [updateCustomerInfo]);

  useEffect(() => {
    if (isAuthLoading) return;
    let disposed = false;
    const listener = (nextCustomerInfo: CustomerInfo) => {
      if (!disposed) updateCustomerInfo(nextCustomerInfo);
    };

    async function initialize() {
      try {
        await configureRevenueCat(identity?.appUserId);
        if (disposed) return;
        Purchases.addCustomerInfoUpdateListener(listener);
        setIsReady(true);
        const snapshot = await getRevenueCatSnapshot();
        if (disposed) return;
        setCurrentOffering(snapshot.currentOffering);
        updateCustomerInfo(snapshot.customerInfo);
      } catch (cause) {
        if (!disposed) setError(toRevenueCatClientError(cause).message);
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    void initialize();
    return () => {
      disposed = true;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isAuthLoading, updateCustomerInfo]);

  useEffect(() => {
    if (isAuthLoading || !isReady) return;
    let disposed = false;

    async function synchronizeIdentity() {
      setIsLoading(true);
      try {
        const nextCustomerInfo = await identifyRevenueCatCustomer(
          identity?.appUserId ?? null,
          identity?.email,
        );
        if (!disposed) updateCustomerInfo(nextCustomerInfo);
      } catch (cause) {
        if (!disposed) setError(toRevenueCatClientError(cause).message);
      } finally {
        if (!disposed) setIsLoading(false);
      }
    }

    void synchronizeIdentity();
    return () => {
      disposed = true;
    };
  }, [
    identity?.appUserId,
    identity?.email,
    isAuthLoading,
    isReady,
    updateCustomerInfo,
  ]);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      customerInfo,
      currentOffering,
      error,
      isLoading,
      isPremium: hasRevenueCatPremium(customerInfo),
      isReady,
      packages: indexRevenueCatPackages(
        currentOffering?.availablePackages ?? [],
      ),
      presentCustomerCenter: async () => {
        await presentRevenueCatCustomerCenter({
          callbacks: {
            onRestoreCompleted: ({ customerInfo: restored }) =>
              updateCustomerInfo(restored),
            onPromotionalOfferSucceeded: ({ customerInfo: updated }) =>
              updateCustomerInfo(updated),
          },
        });
        await refresh();
      },
      presentPaywall: async () => {
        const result = await presentRevenueCatPaywall(currentOffering);
        await refresh();
        return result;
      },
      presentPaywallIfNeeded: async () => {
        const result = await presentRevenueCatPaywallIfNeeded(currentOffering);
        await refresh();
        return result;
      },
      purchasePackage: async (pkg) => {
        try {
          const purchased = await purchaseRevenueCatPackage(pkg);
          updateCustomerInfo(purchased);
          return purchased;
        } catch (cause) {
          if (isRevenueCatCancellation(cause)) return null;
          throw cause;
        }
      },
      refresh,
      restorePurchases: async () => {
        const restored = await restoreRevenueCatPurchases();
        updateCustomerInfo(restored);
        return restored;
      },
    }),
    [
      customerInfo,
      currentOffering,
      error,
      isLoading,
      isReady,
      refresh,
      updateCustomerInfo,
    ],
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}
