import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { onboardingScreens } from '../constants/onboarding';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { Screen } from './ui/Screen';

type OnboardingScreenProps = {
  index: number;
  nextHref?: Href;
};

export function OnboardingScreen({ index, nextHref }: OnboardingScreenProps) {
  const { completeOnboarding } = useAuth();
  const item = onboardingScreens[index];
  const isLast = index === onboardingScreens.length - 1;

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
    <Screen>
      <View className="flex-1 justify-between">
        <View className="items-end">
          {!isLast ? (
            <Pressable
              accessibilityRole="button"
              className="h-10 justify-center px-2"
              onPress={finishOnboarding}
            >
              <Text className="text-sm font-semibold text-slate-300">Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-8">
          <View className="h-72 justify-end overflow-hidden rounded-lg border border-white/10 bg-slate-900 p-5">
            <View className="absolute left-5 top-5 h-20 w-20 rounded-lg border border-white/10 bg-white/10" />
            <View
              className={`absolute right-6 top-10 h-24 w-24 rounded-full ${item.accent}`}
            />
            <View className="absolute bottom-20 left-8 right-8 h-24 rounded-lg border border-white/10 bg-slate-800" />
            <View className="gap-3">
              <View className={`h-3 w-24 rounded-full ${item.accent}`} />
              <View className="h-3 w-40 rounded-full bg-white/30" />
              <View className="h-3 w-32 rounded-full bg-white/20" />
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold uppercase tracking-widest text-teal-300">
              {item.eyebrow}
            </Text>
            <Text className="mt-3 text-4xl font-bold leading-tight text-white">
              {item.title}
            </Text>
            <Text className="mt-4 text-base leading-7 text-slate-300">
              {item.description}
            </Text>
          </View>
        </View>

        <View className="gap-5">
          <View className="flex-row justify-center gap-2">
            {onboardingScreens.map((screen, dotIndex) => (
              <View
                key={screen.title}
                className={`h-2 rounded-full ${
                  dotIndex === index ? `w-8 ${item.accent}` : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </View>

          <Button title={isLast ? 'Get started' : 'Next'} onPress={handleNext} />
        </View>
      </View>
    </Screen>
  );
}
