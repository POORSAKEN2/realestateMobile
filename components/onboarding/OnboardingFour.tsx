import { Feather } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { Screen } from "../ui/Screen";
import { OnboardingControls, OnboardingProgress } from "./OnboardingControls";
import analytics from "../../assets/images/analytics.png";
const analyticsCardShadow = {
  elevation: 10,
  shadowColor: "#1E1F45",
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
            className="h-80 w-80 overflow-hidden rounded-[32px] border border-textPrimary/10 bg-whitePrimary p-6"
            style={analyticsCardShadow}
          >
            <View className="absolute inset-0 bg-dangerSurface" />
            {/* <View className="absolute -right-12 -top-14 h-32 w-32 rounded-full bg-dangerSurface" /> */}
            {/* <View className="absolute -bottom-14 -left-12 h-36 w-36 rounded-full bg-warningSurface" /> */}

            <View className="flex-row items-start justify-between">
              <View>
                <Text className="font-ralewayExtraBold text-font10 uppercase tracking-widest text-textPrimary">
                  Analytics
                </Text>
                <Text className="mt-2 font-ralewayBold text-3xl text-textPrimary">
                  Cash flow
                </Text>
              </View>

              <View className="h-11 w-11 items-center justify-center rounded-2xl border border-danger/20 bg-whitePrimary/90 shadow-sm">
                <Feather name="trending-up" size={20} color="#1E1F45" />
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
                <Text className="font-ralewayExtraBold text-font10 uppercase tracking-widest text-textPrimary">
                  Return
                </Text>
                <Text className="mt-1 font-ralewayBold text-lg text-success">
                  +18%
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-white/80 bg-whitePrimary/85 p-3 shadow-sm">
                <Text className="font-ralewayExtraBold text-font10 uppercase tracking-widest text-textPrimary">
                  Expenses
                </Text>
                <Text className="mt-1 font-ralewayBold text-lg text-danger">
                  42k
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-8">
          <View className=" mb-5">
            <Text className="my-5 font-ralewayExtraBold text-4xl leading-tight  text-textPrimary">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-textPrimary">
              {item.description}
            </Text>
          </View>

          <OnboardingControls
            activeIndex={3}
            dotClassName="bg-warning"
            nextHref="/(onboarding)/screen-5"
          />
        </View>
      </View>
    </Screen>
  );
}
