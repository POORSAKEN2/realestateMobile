import { Feather } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';
import analytics from '../../assets/images/analytics.png';
const analyticsCardShadow = {
  elevation: 10,
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.16,
  shadowRadius: 28,
};

export function OnboardingFour() {
  const item = onboardingScreens[3];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={3} />

        <View className="w-full flex-1 items-center justify-center">
          <View
            className="h-80 w-80 overflow-hidden rounded-[32px] border border-slate-100 bg-whitePrimary p-6"
            style={analyticsCardShadow}
          >
            <View className="absolute inset-0 bg-rose-50/35" />
            {/* <View className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-rose-100/70" /> */}
            {/* <View className="absolute -bottom-14 -left-12 h-36 w-36 rounded-full bg-amber-100/80" /> */}

            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-font10 font-soraBold uppercase tracking-widest text-description">
                  Analytics
                </Text>
                <Text className="mt-2 font-soraSemiBold text-3xl text-blackPrimary">
                  Cash flow
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-2xl border border-rose-100 bg-whitePrimary/90 shadow-sm">
                <Feather name="trending-up" size={20} color="#0F172A" />
              </View>
            </View>

            <View className="mt-7 h-36 items-center justify-center">
              <Image
                className="min-h-[115px] w-full"
                resizeMode="contain"
                source={analytics}
              />
            </View>

            <View className=" flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-white/80 bg-whitePrimary/85 p-3 shadow-sm">
                <Text className="text-font10 font-soraBold uppercase tracking-widest text-description">
                  Return
                </Text>
                <Text className="mt-1 font-soraSemiBold text-lg text-teal-700">+18%</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-white/80 bg-whitePrimary/85 p-3 shadow-sm">
                <Text className="text-font10 font-soraBold uppercase tracking-widest text-description">
                  Expenses
                </Text>
                <Text className="mt-1 font-soraSemiBold text-lg text-rose-700">42k</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 text-4xl font-bold leading-tight  text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={3}
            dotClassName="bg-amber-300"
            nextHref="/(onboarding)/screen-5"
          />
        </View>
      </View>
    </Screen>
  );
}
