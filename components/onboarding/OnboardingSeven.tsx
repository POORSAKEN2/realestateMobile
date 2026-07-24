import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';

export function OnboardingSeven() {
  const item = onboardingScreens[6];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={6} />

        <View className="flex-1 justify-center">
          <View className="items-center">
            <View className="my-5 items-center">
              <Text className="text-center font-ralewayBold text-font24 text-blackPrimary">
                {item.title}
              </Text>
              <Text className="mt-2 text-center text-font14 text-description">
                Your R.E.M. workspace is ready.
              </Text>
            </View>

            <View className="h-80 w-80 my-5  justify-between overflow-hidden rounded-[32px] border border-whitePrimary bg-whitePrimary/90 p-5 shadow-2xl">
              <View className="flex-row items-start justify-between gap-3">
                <View>
                  <Text className="text-font10 font-ralewayExtraBold uppercase tracking-widest text-description">
                    Property Location
                  </Text>
                  <Text className="mt-2 font-ralewayBold text-xl leading-tight text-blackPrimary">
                    Makati City
                  </Text>
                </View>

                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 shadow-sm">
                  <FontAwesome6 name="location-crosshairs" size={20} color="black" />
                </View>
              </View>

              <View className="relative h-24 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner">
                <View className="absolute inset-0">
                  <View className="absolute left-6 top-0 h-full w-px bg-slate-300/60" />
                  <View className="absolute left-12 top-0 h-full w-px bg-slate-300/60" />
                  <View className="absolute left-20 top-0 h-full w-px bg-slate-300/60" />
                  <View className="absolute right-10 top-0 h-full w-px bg-slate-300/60" />
                  <View className="absolute left-0 top-6 h-px w-full bg-slate-300/60" />
                  <View className="absolute left-0 top-12 h-px w-full bg-slate-300/60" />
                  <View className="absolute bottom-6 left-0 h-px w-full bg-slate-300/60" />
                </View>
                <View className="absolute left-7 top-5 h-8 w-16 rounded-full border border-teal-500/25 bg-teal-500/10" />
                <View className="absolute bottom-5 right-7 h-7 w-20 rounded-full border border-sky-500/20 bg-sky-500/10" />
                <View className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-5 -translate-y-5 items-center justify-center rounded-full bg-blackPrimary shadow-xl">
                  <Feather name="map-pin" size={20} color="#FFFFFF" />
                </View>
              </View>

              <View className="rounded-2xl border border-slate-200 bg-whitePrimary/80 p-3 shadow-sm">
                <View className="flex-row items-center gap-2">
                  <Feather name="navigation" size={14} color="#0f766e" />
                  <Text className="text-xs font-ralewaySemiBold text-description">
                    Pinned asset address
                  </Text>
                </View>
                <Text className="mt-1 text-sm font-ralewayBold leading-snug text-blackPrimary">
                  32 Ayala Avenue, Unit 1204
                </Text>
              </View>
            </View>

            {/* <Text className="mt-3 text-center text-4xl font-ralewayExtraBold leading-tight text-white">
           
            </Text> */}
        
          </View>
        </View>

        <View className="flex-col">
          <Text className="my-5 text-center text-base leading-7 text-description">
            {item.description}
          </Text>

          <View className="w-full">
            <OnboardingControls
              activeIndex={6}
              buttonTitle="Get Started"
              dotClassName="bg-cyan-300"
              fullWidthButton
              showSkip={false}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
