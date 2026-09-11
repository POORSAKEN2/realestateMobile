import RevenueCatUI, {
  PAYWALL_RESULT,
  type PresentCustomerCenterParams,
} from "react-native-purchases-ui";
import type { PurchasesOffering } from "react-native-purchases";

import {
  configureRevenueCat,
  toRevenueCatClientError,
} from "./revenueCatClient";

export { PAYWALL_RESULT };

export async function presentRevenueCatPaywall(
  offering?: PurchasesOffering | null,
) {
  await configureRevenueCat();
  try {
    return await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
      ...(offering ? { offering } : {}),
    });
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}

export async function presentRevenueCatPaywallIfNeeded(
  offering?: PurchasesOffering | null,
  requiredEntitlementIdentifier: string = "tier1_access",
) {
  await configureRevenueCat();
  try {
    return await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier,
      displayCloseButton: true,
      ...(offering ? { offering } : {}),
    });
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}

export async function presentRevenueCatCustomerCenter(
  params?: PresentCustomerCenterParams,
) {
  await configureRevenueCat();
  try {
    await RevenueCatUI.presentCustomerCenter(params);
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}
