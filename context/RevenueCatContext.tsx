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
import { AppState } from "react-native";

import { reconcileBillingEntitlement } from "../api/billing";
import {
  BILLING_ENTITLEMENT_QUERY_KEY,
  billingEntitlementQueryKey,
  useBillingEntitlement,
} from "../hooks/api/useBillingEntitlement";
import { type RevenueCatProductKey } from "../constants/revenueCat";
import { hasAppPermission } from "../utils/auth/accessPolicy";
import { authorizeBillingPurchase } from "../utils/billing/billingPurchasePolicy";
import { useAuth } from "../hooks/useAuth";
import type {
  BillingEntitlement,
  SubscriptionTierKey,
} from "../types/domain/billing";
import { type BillingSyncStatus } from "../utils/billing/billingSync";
import { createBillingEntitlementSynchronizer } from "../services/billing/billingEntitlementSync";
import { billingEntitlementRefreshInterval } from "../utils/billing/billingRefreshPolicy";
import { getBillingAccountState } from "../utils/billing/billingAccountState";
import {
  configureRevenueCat,
  getCurrentRevenueCatOffering,
  identifyRevenueCatCustomer,
  isRevenueCatCancellation,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
  toRevenueCatClientError,
} from "../services/billing/revenueCatClient";
import {
  presentRevenueCatCustomerCenter,
  prepareRevenueCatCustomerCenter,
} from "../services/billing/revenueCatUi";
import {
  getRevenueCatEntitlementFingerprint,
  hasRevenueCatPremium,
  getActiveRevenueCatTier,
  indexRevenueCatPackages,
  getRevenueCatIdentity,
} from "../utils/billing/revenueCatCustomer";

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
  prepareCustomerCenter: () => Promise<void>;
  receiveCustomerCenterInfo: (info: CustomerInfo) => void;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo | null>;
  refresh: () => Promise<CustomerInfo | null>;
  restorePurchases: () => Promise<CustomerInfo>;
  waitForSubscriptionValidation: () => Promise<void>;
  serverSyncStatus: BillingSyncStatus;
};

export const RevenueCatContext = createContext<
  RevenueCatContextValue | undefined
>(undefined);

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
  const syncStatus = useRef(serverSyncStatus);
  syncStatus.current = serverSyncStatus;
  const [isForeground, setIsForeground] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  const purchaseUser = useRef(session?.user);
  purchaseUser.current = session?.user;
  const identity = useMemo(
    () => getRevenueCatIdentity(session?.user),
    [session?.user],
  );

  const canReconcile = hasAppPermission(session?.user, "billing.checkout");
  const scope = useMemo(
    () => ({
      appUserId: identity?.appUserId ?? null,
      accessToken: session?.accessToken,
      canReconcile,
    }),
    [identity?.appUserId, session?.accessToken, canReconcile],
  );
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const activeScope = useRef<typeof scope | null>(null);
  const identifiedScope = useRef<typeof scope | null>(null);
  const validationRequest = useRef<{
    scope: typeof scope;
    promise: Promise<CustomerInfo | null>;
  } | null>(null);
  const waitForSubscriptionValidation = useCallback(async () => {
    if (validationRequest.current?.scope === currentScope.current)
      await validationRequest.current.promise;
  }, []);
  const entitlementQuery = useBillingEntitlement({
    enabled:
      !isAuthLoading &&
      isForeground &&
      Boolean(scope.accessToken) &&
      hasAppPermission(session?.user, "billing.viewEntitlement"),
    refetchInterval: (entitlement) =>
      billingEntitlementRefreshInterval(
        entitlement,
        getActiveRevenueCatTier(customerInfo),
        isForeground,
      ),
  });

  useEffect(() => {
    if (
      customerInfo &&
      entitlementQuery.data &&
      !getBillingAccountState(entitlementQuery.data, customerInfo).syncRequired
    )
      setServerSyncStatus("synchronized");
  }, [customerInfo, entitlementQuery.data]);

  const serverSynchronizer = useMemo(
    () =>
      createBillingEntitlementSynchronizer({
        reconcile: () => reconcileBillingEntitlement(scope.accessToken),
        isCurrent: () =>
          currentScope.current === scope &&
          activeScope.current === scope &&
          Boolean(scope.appUserId) &&
          Boolean(scope.accessToken) &&
          scope.canReconcile,
        onEntitlement: async (entitlement) => {
          const queryKey = billingEntitlementQueryKey(scope.appUserId);
          await queryClient.cancelQueries({ queryKey });
          if (currentScope.current === scope)
            queryClient.setQueryData(queryKey, entitlement);
        },
        onStatus: setServerSyncStatus,
        onDelayed: (cause) => {
          console.warn("billing_entitlement_auto_sync_delayed", {
            appUserId: scope.appUserId,
            message:
              cause instanceof Error
                ? cause.message
                : "RevenueCat has not confirmed the server entitlement yet",
          });
          void queryClient.invalidateQueries({
            queryKey: BILLING_ENTITLEMENT_QUERY_KEY,
          });
        },
      }),
    [scope, queryClient],
  );

  const synchronizeServerEntitlement = useCallback(
    (nextCustomerInfo?: CustomerInfo, force = false) => {
      const fingerprint = nextCustomerInfo
        ? getRevenueCatEntitlementFingerprint(nextCustomerInfo)
        : null;
      return serverSynchronizer.synchronize(
        getActiveRevenueCatTier(nextCustomerInfo ?? null),
        fingerprint,
        force,
      );
    },
    [serverSynchronizer],
  );

  const updateCustomerInfo = useCallback(
    (nextCustomerInfo: CustomerInfo, force = false) => {
      if (currentScope.current !== scope || activeScope.current !== scope)
        return Promise.resolve();
      setCustomerInfo(nextCustomerInfo);
      setError(null);
      return synchronizeServerEntitlement(nextCustomerInfo, force);
    },
    [scope, synchronizeServerEntitlement],
  );

  const refresh = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!scope.accessToken || !scope.appUserId) return null;
      if (!options.silent) setIsLoading(true);
      try {
        await configureRevenueCat(scope.appUserId);
        const nextCustomerInfo = await identifyRevenueCatCustomer(
          scope.appUserId,
          options.silent ? undefined : identity?.email,
          { fresh: true },
        );
        if (currentScope.current !== scope || activeScope.current !== scope)
          return null;
        identifiedScope.current = scope;
        setIsReady(true);
        if (!options.silent)
          void getCurrentRevenueCatOffering()
            .then((offering) => {
              if (currentScope.current === scope) setCurrentOffering(offering);
            })
            .catch((cause) => {
              console.warn(
                "revenuecat_offering_unavailable",
                toRevenueCatClientError(cause).message,
              );
            });
        await updateCustomerInfo(
          nextCustomerInfo,
          !options.silent ||
            syncStatus.current === "delayed" ||
            getBillingAccountState(
              queryClient.getQueryData<BillingEntitlement>(
                billingEntitlementQueryKey(scope.appUserId),
              ),
              nextCustomerInfo,
            ).syncRequired,
        );
        return nextCustomerInfo;
      } catch (cause) {
        const nextError = toRevenueCatClientError(cause);
        if (currentScope.current === scope && activeScope.current === scope) {
          setError(nextError.message);
          if (!options.silent)
            await synchronizeServerEntitlement(undefined, true);
        }
        throw nextError;
      } finally {
        if (
          currentScope.current === scope &&
          activeScope.current === scope &&
          !options.silent
        )
          setIsLoading(false);
      }
    },
    [
      scope,
      identity?.email,
      updateCustomerInfo,
      synchronizeServerEntitlement,
      queryClient,
    ],
  );

  useEffect(() => {
    if (isAuthLoading) return;
    let disposed = false;
    let pendingRefresh: Promise<CustomerInfo | null> | null = null;
    activeScope.current = scope;
    setIsForeground(
      AppState.currentState !== "background" &&
        AppState.currentState !== "inactive",
    );
    identifiedScope.current = null;
    setCustomerInfo(null);
    setCurrentOffering(null);
    setError(null);
    setIsReady(false);
    setServerSyncStatus("idle");
    const listener = (nextCustomerInfo: CustomerInfo) => {
      if (!disposed && identifiedScope.current === scope)
        void updateCustomerInfo(nextCustomerInfo);
    };
    function refreshOnce(silent = false) {
      if (pendingRefresh) return;
      pendingRefresh = refresh({ silent })
        .catch(() => null)
        .finally(() => {
          pendingRefresh = null;
        });
      validationRequest.current = { scope, promise: pendingRefresh };
    }
    Purchases.addCustomerInfoUpdateListener(listener);
    if (scope.accessToken && scope.appUserId) refreshOnce();
    else {
      setIsLoading(false);
      void identifyRevenueCatCustomer(null).catch(() => {});
    }
    const subscription = AppState.addEventListener("change", (state) => {
      setIsForeground(state === "active");
      if (state === "active" && scope.accessToken && scope.appUserId)
        refreshOnce();
    });
    const timer = setInterval(() => {
      if (
        AppState.currentState === "active" &&
        scope.accessToken &&
        scope.appUserId
      )
        refreshOnce(true);
    }, 60_000);
    return () => {
      disposed = true;
      if (activeScope.current === scope) activeScope.current = null;
      clearInterval(timer);
      subscription.remove();
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isAuthLoading, scope, refresh, updateCustomerInfo]);

  const packages = useMemo(
    () => indexRevenueCatPackages(currentOffering?.availablePackages ?? []),
    [currentOffering],
  );

  const prepareCustomerCenter = useCallback(async () => {
    authorizeBillingPurchase(purchaseUser.current);
    await prepareRevenueCatCustomerCenter();
  }, []);

  const value = useMemo<RevenueCatContextValue>(
    () => ({
      activeTier: getActiveRevenueCatTier(customerInfo),
      customerInfo,
      currentOffering,
      error,
      isLoading,
      isPremium: hasRevenueCatPremium(customerInfo),
      isReady,
      packages,
      prepareCustomerCenter,
      receiveCustomerCenterInfo: updateCustomerInfo,
      presentCustomerCenter: async () => {
        authorizeBillingPurchase(purchaseUser.current);
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
        authorizeBillingPurchase(purchaseUser.current, pkg.product.identifier);
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
        authorizeBillingPurchase(purchaseUser.current);
        const restored = await restoreRevenueCatPurchases();
        updateCustomerInfo(restored);
        return restored;
      },
      waitForSubscriptionValidation,
      serverSyncStatus,
    }),
    [
      customerInfo,
      currentOffering,
      error,
      isLoading,
      isReady,
      packages,
      refresh,
      prepareCustomerCenter,
      serverSyncStatus,
      updateCustomerInfo,
      waitForSubscriptionValidation,
    ],
  );

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}
