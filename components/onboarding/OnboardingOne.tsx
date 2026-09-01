import { Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { OnboardingControls } from "./OnboardingControls";
import { OnboardingPageLayout } from "./OnboardingPageLayout";
import BrandLogomark from "../../assets/branding/svg/brand-combination-vertical.svg";

export function OnboardingOne() {
  const item = onboardingScreens[0];

  return (
    <OnboardingPageLayout
      activeIndex={0}
      copy={
        <View className="mb-5">
          <Text className="my-5 font-ralewayExtraBold text-4xl leading-tight text-textPrimary">
            {item.title}
          </Text>

          <Text className="text-base leading-7 text-textPrimary">
            {item.description}
          </Text>
        </View>
      }
      footer={
        <OnboardingControls activeIndex={0} nextHref="/(onboarding)/screen-2" />
      }
      visual={
        <View className="flex-1 items-center justify-normal">
          <BrandLogomark width="80%" height="120%" />
        </View>
      }
    />
  );
}
