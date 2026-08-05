import { Text, View, Image } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { Screen } from "../ui/Screen";
import { OnboardingControls, OnboardingProgress } from "./OnboardingControls";
import BrandLogomark from "../../assets/branding/svg/brand-logomark.svg";

export function OnboardingOne() {
  const item = onboardingScreens[0];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between ">
        <OnboardingProgress activeIndex={0} />

        <View className="flex-1 items-center justify-center">
          <BrandLogomark width="100%" height="100%" />
        </View>

        <View className="gap-8">
          <View className=" mb-5">
            <Text className="my-5 font-ralewayExtraBold text-4xl leading-tight text-black">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-description">
              {item.description}
            </Text>
          </View>

          <OnboardingControls
            activeIndex={0}
            dotClassName="bg-accent"
            nextHref="/(onboarding)/screen-2"
          />
        </View>
      </View>
    </Screen>
  );
}
