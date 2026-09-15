import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { reconcileBillingEntitlement } from "../api/billing";
import { BILLING_ENTITLEMENT_QUERY_KEY } from "../hooks/api/useBillingEntitlement";
import { type RevenueCatProductKey } from "../constants/revenueCat";
import { useAuth } from "../hooks/useAuth";
import type { SubscriptionTierKey } from "../types/domain/billing";
import {
  type BillingSyncStatus,
  reconcileBillingWithBackoff,
} from "../utils/billing/billingSync";
import {
  configureRevenueCat,
  getRevenueCatSnapshot,
  identifyRevenueCatCustomer,
  isRevenueCatCancellation,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  toRevenueCatClientError,
} from "../services/billing/revenueCatClient";
import { presentRevenueCatCustomerCenter } from "../services/billing/revenueCatUi";
import {
  getRevenueCatEntitlementFingerprint,
  hasRevenueCatPremium,
  getActiveRevenueCatTier,
  indexRevenueCatPackages,
} from "../utils/billing/revenueCatCustomer";

type RevenueCatIdentity = {
  appUserId: string;
  email: string | null;
};

type RevenueCatContextValue = {
  activeTier: SubscriptionTierKey;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  error: string | null;
  isLoading: boolean;
  isPremium: boolean;
  isReady: boolean;
  packages: Record<RevenueCatProductKey, PurchasesPackage | null>;
  presentCustomerCenter: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  refresh: () => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo>;
  serverSyncStatus: BillingSyncStatus;
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
  const [serverSyncStatus, setServerSyncStatus] =
    useState<BillingSyncStatus>("idle");
  const pendingServerTier = useRef<SubscriptionTierKey>("free");
  const lastServerSyncFingerprint = useRef<string | null>(null);
  const serverSyncRequestVersion = useRef(0);
  const serverSyncWorker = useRef<Promise<void> | null>(null);
  const identity = useMemo(
    () => getRevenueCatIdentity(session?.user),
    [session?.user],
  );

  const synchronizeServerEntitlement = useCallback(
    (nextCustomerInfo: CustomerInfo) => {
      if (!identity?.appUserId) return;
      const fingerprint = JSON.stringify([
        identity.appUserId,
        getRevenueCatEntitlementFingerprint(nextCustomerInfo),
      ]);
      if (lastServerSyncFingerprint.current === fingerprint) return;
      lastServerSyncFingerprint.current = fingerprint;
      pendingServerTier.current = getActiveRevenueCatTier(nextCustomerInfo);
      serverSyncRequestVersion.current += 1;
      if (serverSyncWorker.current) return;

      const worker = async () => {
        let handledVersion = 0;

        while (handledVersion < serverSyncRequestVersion.current) {
          handledVersion = serverSyncRequestVersion.current;
          const targetTier = pendingServerTier.current;
          setServerSyncStatus("syncing");
          const result = await reconcileBillingWithBackoff(
            reconcileBillingEntitlement,
            targetTier,
          );

          if (result.entitlement) {
            queryClient.setQueryData(
              BILLING_ENTITLEMENT_QUERY_KEY,
              result.entitlement,
            );
          }

          if (result.synchronized) {
            setServerSyncStatus("synchronized");
            continue;
          }

          setServerSyncStatus("delayed");
          console.warn("billing_entitlement_auto_sync_delayed", {
            appUserId: identity.appUserId,
            message:
              result.error instanceof Error
                ? result.error.message
                : "RevenueCat has not confirmed the server entitlement yet",
            targetTier,
          });
          void queryClient.invalidateQueries({
            queryKey: BILLING_ENTITLEMENT_QUERY_KEY,
          });
        }
      };

      serverSyncWorker.current = worker().finally(() => {
        serverSyncWorker.current = null;
      });
    },
    [identity?.appUserId, queryClient],
  );

  const updateCustomerInfo = useCallback(
    (nextCustomerInfo: CustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
      setError(null);
      synchronizeServerEntitlement(nextCustomerInfo);
    },
    [synchronizeServerEntitlement],
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
      activeTier: getActiveRevenueCatTier(customerInfo),
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
      serverSyncStatus,
    }),
    [
      customerInfo,
      currentOffering,
      error,
      isLoading,
      isReady,
      refresh,
      serverSyncStatus,
      updateCustomerInfo,
    ],
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}
