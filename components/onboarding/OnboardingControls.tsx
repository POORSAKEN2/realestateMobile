import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { useAuth } from '../../hooks/useAuth';

type OnboardingProgressProps = {
  activeIndex: number;
};

const progressAccentColors = [
  '#2DD4BF',
  '#38BDF8',
  '#FCD34D',
  '#FDA4AF',
  '#C4B5FD',
  '#BEF264',
  '#67E8F9',
];

export function OnboardingProgress({ activeIndex }: OnboardingProgressProps) {
  const totalScreens = onboardingScreens.length;
  const currentStep = activeIndex + 1;
  const progress = (currentStep / totalScreens) * 100;
  const accentColor = progressAccentColors[activeIndex] ?? '#2563EB';

  return (
    <View className="w-full">
      <View className="flex-row items-center gap-3">
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: accentColor,
              width: `${progress}%` as `${number}%`,
            }}
          />
        </View>

        <Text className="shrink-0 text-font12 font-ralewayBold text-blackPrimary">
          {currentStep}/{totalScreens}
        </Text>
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
  dotClassName = 'bg-teal-400',
  fullWidthButton = false,
  showSkip = true,
}: OnboardingControlsProps) {
  const { completeOnboarding } = useAuth();
  const isLast = activeIndex === onboardingScreens.length - 1;

  function finishOnboarding() {
    completeOnboarding();
    router.replace('/(auth)/login');
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
      {/* <View className="flex-row justify-center gap-2">
        {onboardingScreens.map((screen, index) => (
          <View
            key={screen.title}
            className={`h-2 rounded-full ${
              index === activeIndex ? `w-8 ${dotClassName}` : 'w-2 bg-description/30'
            }`}
          />
        ))}
      </View> */}

      <View className="flex-row items-center justify-between">
        {showSkip && !isLast ? (
          <Pressable
            accessibilityRole="button"
            className="h-12 min-w-28 items-center justify-center rounded-full border border-description px-6"
            onPress={finishOnboarding}
          >
            <Text className="text-font14 font-ralewaySemiBold text-description">Skip</Text>
          </Pressable>
        ) : fullWidthButton ? null : (
          <View className="min-w-28" />
        )}

        <Pressable
          accessibilityRole="button"
          className={`h-12 items-center justify-center rounded-full bg-primary px-6 ${
            fullWidthButton ? 'w-full' : 'min-w-32'
          }`}
          onPress={handleNext}
        >
          <Text className="text-font14 font-ralewaySemiBold text-whitePrimary">
            {buttonTitle ?? (isLast ? 'Get started' : 'Next')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
