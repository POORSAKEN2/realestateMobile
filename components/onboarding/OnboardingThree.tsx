import { Image, Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';
import step3 from '../../assets/images/step3.png';

const leaseCardShadow = {
  elevation: 14,
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.2,
  shadowRadius: 30,
};

export function OnboardingThree() {
  const item = onboardingScreens[2];

  return (
    <Screen className='bg-whitePrimary'>
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={2} />

        <View
              className="absolute top-28 left-5 right-5 z-20 overflow-hidden rounded-[24px] border border-white/80 bg-whitePrimary/90 p-3"
              style={leaseCardShadow}
            >
              <View className="absolute left-4 right-4 top-2 h-6 rounded-full bg-white/60" />
              {/* <View className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-sky-100/60" /> */}
              {/* <View className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-teal-100/70" /> */}

              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-teal-700">
                  <Text className="text-xs font-ralewayExtraBold text-whitePrimary">JD</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[9px] font-ralewayBold uppercase tracking-widest text-description">
                    Tenant
                  </Text>
                  <Text className="text-sm font-ralewayExtraBold text-slate-950">Juan De La Cruz</Text>
                </View>
                <View className="rounded-full border border-teal-100 bg-teal-50/90 px-2.5 py-1">
                  <Text className="text-[9px] font-ralewayExtraBold uppercase tracking-widest text-teal-800">
                    Active
                  </Text>
                </View>
              </View>

              <View className="mt-3 gap-2">
                <View className="rounded-2xl border border-white/80 bg-white/55 px-2.5 py-2">
                  <Text className="text-[9px] font-ralewayBold uppercase tracking-widest text-description">
                    Property
                  </Text>
                  <Text className="text-[11px] font-ralewayExtraBold leading-4 text-slate-950">
                    The Shard (Calapan, Oriental Mindoro)
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 rounded-2xl border border-white/80 bg-white/55 px-2.5 py-2">
                    <Text className="text-[9px] font-ralewayBold uppercase tracking-widest text-description">
                      Room
                    </Text>
                    <Text className="text-xs font-ralewayExtraBold text-slate-950">21</Text>
                  </View>
                  <View className="flex-[1.6] rounded-2xl px-2.5 py-2">
                    <Text className="text-[9px] font-ralewayBold uppercase tracking-widest text-teal-700">
                      Monthly Rent
                    </Text>
                    <Text className="text-xs font-ralewayExtraBold text-teal-900">50,000</Text>
                  </View>
                </View>

                <View className="rounded-2xl border border-sky-100/90 bg-sky-50/80 px-2.5 py-2">
                  <Text className="text-[9px] font-ralewayBold uppercase tracking-widest text-sky-700">
                    Lease Term
                  </Text>
                  <Text className="text-[11px] font-ralewayExtraBold leading-4 text-slate-950">
                    May 7, 2026 - June 30, 2026
                  </Text>
                </View>
              </View>
            </View>


        <View className="w-full flex-1 items-center justify-end">

          

          <View className="h-80 mb-16 w-full overflow-visible">
            <Image
              className="absolute inset-0 z-0 h-full w-full rounded-2xl"
              resizeMode="cover"
              source={step3}
            />

            <View className="absolute inset-0 z-10 rounded-2xl " />

            
           
          </View>
        </View>

        <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 max-w-[330px] text-4xl font-ralewayExtraBold leading-tight text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={2}
            dotClassName="bg-amber-300"
            nextHref="/(onboarding)/screen-4"
          />
        </View>

      </View>
    </Screen>
  );
}
