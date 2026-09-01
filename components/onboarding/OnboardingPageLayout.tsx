import type { ReactNode } from "react";
import { View } from "react-native";

import { Screen } from "../ui/Screen";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingStepTransition } from "./OnboardingTransition";

type OnboardingPageLayoutProps = {
  activeIndex: number;
  copy: ReactNode;
  footer: ReactNode;
  visual: ReactNode;
};

export function OnboardingPageLayout({
  activeIndex,
  copy,
  footer,
  visual,
}: OnboardingPageLayoutProps) {
  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1">
        <OnboardingProgress activeIndex={activeIndex} />
        <OnboardingStepTransition copy={copy} footer={footer} visual={visual} />
      </View>
    </Screen>
  );
}
