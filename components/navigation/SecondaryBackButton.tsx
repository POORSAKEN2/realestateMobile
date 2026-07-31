import { router, type Href } from "expo-router";

import { appRoutes } from "../../constants/navigation";
import {
  BackButton,
  type BackButtonVariant,
} from "../ui/buttons/BackButton";

type SecondaryBackButtonProps = {
  accessibilityLabel?: string;
  fallbackRoute?: Href;
  navigation?: BackNavigation;
  variant?: BackButtonVariant;
};

export type BackNavigation = {
  back: () => void;
  canGoBack: () => boolean;
  replace: (route: Href) => void;
};

const expoRouterNavigation: BackNavigation = {
  back: () => router.back(),
  canGoBack: () => router.canGoBack(),
  replace: (route) => router.replace(route),
};

export function SecondaryBackButton({
  accessibilityLabel = "Go back",
  fallbackRoute = appRoutes.primary.dashboard,
  navigation = expoRouterNavigation,
  variant,
}: SecondaryBackButtonProps) {
  function handlePress() {
    if (navigation.canGoBack()) {
      navigation.back();
      return;
    }

    navigation.replace(fallbackRoute);
  }

  return (
    <BackButton
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      variant={variant}
    />
  );
}
