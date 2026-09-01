import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";

type OnboardingProgressProps = {
  activeIndex: number;
};

export function OnboardingProgress({ activeIndex }: OnboardingProgressProps) {
  const totalScreens = onboardingScreens.length;
  const currentStep = activeIndex + 1;
  const progress = useRef(
    new Animated.Value(activeIndex / totalScreens),
  ).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
      toValue: currentStep / totalScreens,
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [currentStep, progress, totalScreens]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      accessibilityLabel={`Onboarding step ${currentStep} of ${totalScreens}`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: totalScreens,
        min: 1,
        now: currentStep,
      }}
      className="w-full"
    >
      <View className="h-2 overflow-hidden rounded-full bg-accent/40">
        <Animated.View
          className="h-full rounded-full bg-primary"
          style={{ width: progressWidth }}
        />
      </View>
    </View>
  );
}
