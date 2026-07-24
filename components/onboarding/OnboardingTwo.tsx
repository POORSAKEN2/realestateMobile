import { Image, Text, View } from 'react-native';

import { onboardingScreens } from '../../constants/onboarding';
import { Screen } from '../ui/Screen';
import { OnboardingControls, OnboardingProgress } from './OnboardingControls';
import onboard1 from '../../assets/images/onboard1.jpg';
import onboard2 from '../../assets/images/onboard2.webp';
import onboard3 from '../../assets/images/onboard3.jpg'
const imageCardShadow = {
  elevation: 4,
  shadowColor: '#1d1d1f',
  shadowOffset: { width: 0, height: 15 },
  shadowOpacity: 0.2,
  shadowRadius: 30,
};

const propertyImages = {
  left: onboard1,
  center: onboard2,
  right: onboard3,
};

export function OnboardingTwo() {
  const item = onboardingScreens[1];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={1} />

        <View className="-mx-6 h-96 justify-center overflow-hidden bg-whitePrimary">
          <View className="absolute inset-0 flex-row">
            {/* <View className="flex-1 bg-rose-50" />
            <View className="flex-1 bg-whitePrimary" />
            <View className="flex-1 bg-sky-50" />
            <View className="flex-1 bg-whitePrimary" />
            <View className="flex-1 bg-rose-50" />
            <View className="flex-1 bg-whitePrimary" />
            <View className="flex-1 bg-sky-50" />
            <View className="flex-1 bg-whitePrimary" /> */}
          </View>

          <View
            className="absolute -left-10 top-12 h-72 w-44 -rotate-6 rounded-[34px] bg-whitePrimary"
            style={imageCardShadow}
          >
            <View className="h-full w-full overflow-hidden rounded-[34px] bg-blackPrimary">
              <Image
                className="h-full w-full opacity-70"
                resizeMode="cover"
                source={propertyImages.left}
              />
              <View className="absolute inset-0 bg-blackPrimary/35" />
            </View>
          </View>

          <View
            className="absolute -right-10 top-12 h-72 w-44 rotate-6 rounded-[34px] bg-whitePrimary"
            style={imageCardShadow}
          >
            <View className="h-full w-full overflow-hidden rounded-[34px] bg-blackPrimary">
              <Image
                className="h-full w-full opacity-70"
                resizeMode="cover"
                 source={ propertyImages.right }
              />
              <View className="absolute inset-0 bg-blackPrimary/25" />
            </View>
          </View>

          <View
            className="z-10 self-center rounded-[38px] bg-whitePrimary"
            style={imageCardShadow}
          >
            <View className="overflow-hidden rounded-[38px]">
              <Image
                className="h-80 w-72"
                resizeMode="cover"
                source={ propertyImages.center }
              />
            </View>
          </View>
        </View>

        <View className="gap-8">
          <View className=' mb-5'>

            <Text className="my-5 text-4xl font-ralewayExtraBold leading-tight text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">{item.description}</Text>

          </View>
         
          <OnboardingControls
            activeIndex={1}
            dotClassName="bg-sky-400"
            nextHref="/(onboarding)/screen-3"
          />
        </View>
      </View>
    </Screen>
  );
}
