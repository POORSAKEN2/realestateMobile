import RevenueCatUI, {
  type PresentCustomerCenterParams,
} from "react-native-purchases-ui";

import {
  configureRevenueCat,
  toRevenueCatClientError,
} from "./revenueCatClient";
import { prepareCustomerCenterWithTimeout } from "../../utils/billing/customerCenterPreparation";

export function prepareRevenueCatCustomerCenter() {
  return prepareCustomerCenterWithTimeout(() => configureRevenueCat());
}

export async function presentRevenueCatCustomerCenter(
  params?: PresentCustomerCenterParams,
) {
  await prepareRevenueCatCustomerCenter();
  try {
    await RevenueCatUI.presentCustomerCenter(params);
  } catch (error) {
    throw toRevenueCatClientError(error);
  }
}
