import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import { REVENUECAT_OFFERING_ID } from "../../constants/revenueCat";

const genericApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY?.trim();

function getRevenueCatApiKey() {
  if (Platform.OS === "ios") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || genericApiKey
    );
  }

  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ||
      genericApiKey
    );
  }

  return (
    process.env.EXPO_PUBLIC_REVENUECAT_WEB_API_KEY?.trim() || genericApiKey
  );
}

let configurationPromise: Promise<void> | null = null;

export class RevenueCatClientError extends Error {
  constructor(
    message: string,
    readonly code?: PURCHASES_ERROR_CODE,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "RevenueCatClientError";
  }
}

function isPurchasesError(error: unknown): error is PurchasesError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export function toRevenueCatClientError(error: unknown) {
  if (error instanceof RevenueCatClientError) return error;
  if (!isPurchasesError(error)) {
    return new RevenueCatClientError(
      error instanceof Error
        ? error.message
        : "RevenueCat request failed. Please try again.",
      undefined,
      { cause: error },
    );
  }

  const messages: Partial<Record<PURCHASES_ERROR_CODE, string>> = {
    [PURCHASES_ERROR_CODE.NETWORK_ERROR]:
      "Network unavailable. Check your connection and try again.",
    [PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR]:
      "You are offline. Reconnect and try again.",
    [PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR]:
      "Purchase is pending approval. Access will update after payment completes.",
    [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]:
      "This product is already owned. Restore purchases to refresh access.",
    [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]:
      "Product is unavailable. Check RevenueCat and store configuration.",
    [PURCHASES_ERROR_CODE.CONFIGURATION_ERROR]:
      "RevenueCat is not configured correctly for this build.",
    [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]:
      "Purchases are not allowed on this device or store account.",
  };

  return new RevenueCatClientError(
    messages[error.code] || error.message || "RevenueCat request failed.",
    error.code,
    { cause: error },
  );
}

export function isRevenueCatCancellation(error: unknown) {
  return (
    (isPurchasesError(error) || error instanceof RevenueCatClientError) &&
    error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  );
}

export function configureRevenueCat(appUserId?: string | null) {
  if (configurationPromise) return configurationPromise;

  configurationPromise = (async () => {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      throw new RevenueCatClientError(
        "Missing RevenueCat API key. Set EXPO_PUBLIC_REVENUECAT_API_KEY.",
      );
    }

    if (await Purchases.isConfigured()) return;

    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    Purchases.configure({
      apiKey,
      ...(appUserId ? { appUserID: appUserId } : {}),
    });
  })().catch((error) => {
    configurationPromise = null;
    throw toRevenueCatClientError(error);
  });

  return configurationPromise;
}

export async function identifyRevenueCatCustomer(
  appUserId: string | null,
  email?: string | null,
) {
  await configureRevenueCat();

  if (!appUserId) {
    const isAnonymous = await Purchases.isAnonymous();
    return isAnonymous ? Purchases.getCustomerInfo() : Purchases.logOut();
  }

  const currentAppUserId = await Purchases.getAppUserID();
  const customerInfo =
    currentAppUserId === appUserId
      ? await Purchases.getCustomerInfo()
      : (await Purchases.logIn(appUserId)).customerInfo;

  if (email) await Purchases.setEmail(email);
  return customerInfo;
}

export async function getRevenueCatCustomerInfo() {
  await configureRevenueCat();
  return Purchases.getCustomerInfo();
}

export async function getCurrentRevenueCatOffering() {
  await configureRevenueCat();
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID] ?? null;
}

export async function purchaseRevenueCatPackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  await configureRevenueCat();
  try {
    return (await Purchases.purchasePackage(pkg)).customerInfo;
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}

export async function restoreRevenueCatPurchases() {
  await configureRevenueCat();
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}

export type RevenueCatSnapshot = {
  customerInfo: CustomerInfo;
  currentOffering: PurchasesOffering | null;
};

export async function getRevenueCatSnapshot(): Promise<RevenueCatSnapshot> {
  await configureRevenueCat();
  try {
    const [customerInfo, currentOffering] = await Promise.all([
      Purchases.getCustomerInfo(),
      getCurrentRevenueCatOffering(),
    ]);
    return { customerInfo, currentOffering };
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}
