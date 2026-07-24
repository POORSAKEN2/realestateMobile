import { Feather } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';
import philippinesMap from '../../assets/images/philippines-map.png';

export function OnboardingSix() {
  const item = onboardingScreens[5];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={5} />

        <View className="w-full flex-1 items-center justify-center">
          <View className="h-80 w-80 overflow-hidden rounded-[32px] border border-slate-100 bg-whitePrimary/95 shadow-2xl">
            <View className="absolute inset-0">
              <View className="absolute left-6 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-12 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-20 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-28 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-40 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-52 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute right-12 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute right-6 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-0 top-8 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-16 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-28 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-40 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-52 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-64 h-px w-full bg-slate-200/70" />
              <View className="absolute bottom-8 left-0 h-px w-full bg-slate-200/70" />
            </View>

            <View className="absolute inset-y-0 right-0 w-1/2 bg-slate-100/55" />

            <View className="absolute right-30 top-16 h-60 w-60 items-center justify-center">
              <Image
                className="h-full w-full opacity-75"
                resizeMode="contain"
                source={philippinesMap}
                tintColor="#E9BF55"
              />
              <View className="absolute right-50 bottom-20 h-10 w-10 items-center justify-center rounded-full bg-teal-700 shadow-xl">
                <Feather name="map-pin" size={18} color="#FFFFFF" />
              </View>
              {/* <View className="absolute bottom-[76px] right-[50px] h-5 w-5 rounded-full border border-white/70 bg-teal-300/50" /> */}
            </View>

            <View className="absolute right-5 top-12 w-44 rounded-[20px] border border-white/80 bg-whitePrimary/95 p-4 shadow-xl">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-2xl bg-teal-50">
                  <Feather name="navigation" size={15} color="#0F766E" />
                </View>
                <Text className="flex-1 font-ralewayBold text-sm text-blackPrimary">
                  Property Location
                </Text>
              </View>
              <Text className="mt-3 text-xs font-ralewaySemiBold leading-5 text-description">
                Calapan, Oriental Mindoro
              </Text>
              <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <View className="h-full w-3/4 rounded-full bg-teal-500" />
              </View>
            </View>

            <View className="absolute bottom-5 left-5 rounded-2xl border border-white/80 bg-whitePrimary/90 px-4 py-3 shadow-sm">
              <Text className="text-font10 font-ralewayExtraBold uppercase tracking-widest text-description">
                Region
              </Text>
              <Text className="mt-1 font-ralewayBold text-sm text-blackPrimary">
                Philippines
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 text-4xl font-ralewayExtraBold leading-tight  text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={5}
            dotClassName="bg-lime-300"
            nextHref="/(onboarding)/screen-7"
          />
        </View>


      </View>
    </Screen>
  );
}
