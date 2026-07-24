import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';

const folderRows = [
  {
    label: 'Properties',
    iconColor: '#0F766E',
    iconBg: 'bg-teal-50',
    lineClassName: 'bg-teal-700/55',
    meta: '18 files',
  },
  {
    label: 'Bookings',
    iconColor: '#0369A1',
    iconBg: 'bg-sky-50',
    lineClassName: 'bg-sky-700/50',
    meta: '6 pending',
  },
  {
    label: 'Documents',
    iconColor: '#7C3AED',
    iconBg: 'bg-violet-50',
    lineClassName: 'bg-violet-700/45',
    meta: 'Updated',
  },
];

export function OnboardingFive() {
  const item = onboardingScreens[4];

  return (
    <Screen className='bg-whitePrimary'>
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={4} />

        <View className="w-full flex-1 items-center justify-center">
          <View className="h-80 w-80 overflow-hidden rounded-[32px] border border-slate-100 bg-whitePrimary/95 p-5 shadow-2xl">
            <View className="absolute inset-0">
              <View className="absolute left-6 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-12 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-20 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-28 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute right-16 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute right-8 top-0 h-full w-px bg-slate-200/70" />
              <View className="absolute left-0 top-7 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-14 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-24 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-36 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-48 h-px w-full bg-slate-200/70" />
              <View className="absolute left-0 top-60 h-px w-full bg-slate-200/70" />
              <View className="absolute bottom-8 left-0 h-px w-full bg-slate-200/70" />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-font10 font-ralewayExtraBold uppercase tracking-widest text-description">
                  Workspace
                </Text>
                <Text className="mt-2 font-ralewayBold text-xl text-blackPrimary">
                  Organized files
                </Text>
              </View>

              <View className="h-10 w-10 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 shadow-sm">
                <Feather name="archive" size={18} color="#0F766E" />
              </View>
            </View>

            <View className="mt-7 gap-4">
              {folderRows.map((row) => (
                <View
                  className="rounded-3xl border border-white/80 bg-whitePrimary/85 p-3 shadow-sm"
                  key={row.label}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 ${row.iconBg}`}
                    >
                      <Feather name="folder" size={24} color={row.iconColor} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-ralewayBold text-base text-blackPrimary">
                          {row.label}
                        </Text>
                        <Text className="text-font10 font-ralewaySemiBold uppercase tracking-widest text-description">
                          {row.meta}
                        </Text>
                      </View>
                      <View className="mt-2 gap-1.5">
                        <View className={`h-2 w-4/5 rounded-full ${row.lineClassName}`} />
                        <View className="h-2 w-3/5 rounded-full bg-slate-300/80" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* <View className="items-center">
          <Text className="mt-3 text-center text-4xl font-ralewayExtraBold leading-tight text-white">
            {item.title}
          </Text>
          <Text className="mt-4 text-center text-base leading-7 text-slate-300">
            {item.description}
          </Text>
        </View>

        <OnboardingControls
          activeIndex={4}
          dotClassName="bg-violet-300"
          nextHref="/(onboarding)/screen-6"
        /> */}


        <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 text-4xl font-ralewayExtraBold leading-tight  text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={4}
            dotClassName="bg-violet-300"
            nextHref="/(onboarding)/screen-6"
          /> 
        </View>

      </View>
    </Screen>
  );
}
