import { Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';

export function OnboardingOne() {
  const item = onboardingScreens[0];

  return (
    <Screen className='bg-whitePrimary'>
      <View className="flex-1 justify-between ">
       <OnboardingProgress activeIndex={0} />

       <View className="flex-1 items-center justify-center">
          <Text>Logo here</Text>
       </View>

       <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 text-4xl font-ralewayExtraBold leading-tight text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={0}
            dotClassName="bg-sky-400"
            nextHref="/(onboarding)/screen-3"
          />
        </View>

      </View>
    </Screen>
  );
}
