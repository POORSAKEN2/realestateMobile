import RevenueCatUI, {
  type PresentCustomerCenterParams,
} from "react-native-purchases-ui";

import {
  configureRevenueCat,
  toRevenueCatClientError,
} from "./revenueCatClient";

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
