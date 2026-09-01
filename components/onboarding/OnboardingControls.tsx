import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { useAuth } from "../../hooks/useAuth";
import { useOnboardingTransition } from "./OnboardingTransition";

type OnboardingControlsProps = {
  activeIndex: number;
  nextHref?: Href;
  buttonTitle?: string;
  fullWidthButton?: boolean;
  showSkip?: boolean;
};

export function OnboardingControls({
  activeIndex,
  nextHref,
  buttonTitle,
  fullWidthButton = false,
  showSkip = true,
}: OnboardingControlsProps) {
  const { completeOnboarding } = useAuth();
  const runAfterExit = useOnboardingTransition();
  const isLast = activeIndex === onboardingScreens.length - 1;
  const transitionLock = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  function beginTransition(action: () => void) {
    if (transitionLock.current) {
      return;
    }

    transitionLock.current = true;
    action();
    transitionTimer.current = setTimeout(() => {
      transitionLock.current = false;
    }, 500);
  }

  function finishOnboarding() {
    beginTransition(() => {
      runAfterExit(() => {
        completeOnboarding();
        router.replace("/(auth)/login");
      });
    });
  }

  function handleNext() {
    if (nextHref) {
      beginTransition(() => {
        runAfterExit(() => router.replace(nextHref));
      });
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
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
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
          style={({ pressed }) => ({
            opacity: pressed ? 0.82 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Text className="font-ralewaySemiBold text-font14 text-white">
            {buttonTitle ?? (isLast ? "Get started" : "Next")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
