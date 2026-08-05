import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { useAuth } from "../../hooks/useAuth";

type OnboardingProgressProps = {
  activeIndex: number;
};

export function OnboardingProgress({ activeIndex }: OnboardingProgressProps) {
  const totalScreens = onboardingScreens.length;
  const currentStep = activeIndex + 1;
  const progress = (currentStep / totalScreens) * 100;

  return (
    <View className="w-full">
      <View className="flex-row items-center gap-3">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-accent/40">
          <View
            className="h-full rounded-full bg-primary"
            style={{
              width: `${progress}%` as `${number}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}

type OnboardingControlsProps = {
  activeIndex: number;
  nextHref?: Href;
  buttonTitle?: string;
  dotClassName?: string;
  fullWidthButton?: boolean;
  showSkip?: boolean;
};

export function OnboardingControls({
  activeIndex,
  nextHref,
  buttonTitle,
  dotClassName = "bg-teal-400",
  fullWidthButton = false,
  showSkip = true,
}: OnboardingControlsProps) {
  const { completeOnboarding } = useAuth();
  const isLast = activeIndex === onboardingScreens.length - 1;

  function finishOnboarding() {
    completeOnboarding();
    router.replace("/(auth)/login");
  }

  function handleNext() {
    if (nextHref) {
      router.push(nextHref);
      return;
    }

    finishOnboarding();
  }

  return (
    <View className="w-full gap-5">
      <View className="flex-row items-center justify-between">
        {showSkip && !isLast ? (
          <Pressable
            accessibilityRole="button"
            className=" h-12 min-w-28 items-center justify-center rounded-full border border-accent px-6"
            onPress={finishOnboarding}
          >
            <Text className="font-ralewaySemiBold text-font14 text-textPrimary">
              Skip
            </Text>
          </Pressable>
        ) : fullWidthButton ? null : (
          <View className="min-w-28" />
        )}

        <Pressable
          accessibilityRole="button"
          className={`h-12 items-center justify-center rounded-full bg-primary px-6 ${
            fullWidthButton ? "w-full" : "min-w-32"
          }`}
          onPress={handleNext}
        >
          <Text className="font-ralewaySemiBold text-font14 text-white">
            {buttonTitle ?? (isLast ? "Get started" : "Next")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
