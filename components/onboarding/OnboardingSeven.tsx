import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { colors } from "../../constants/colors";
import { onboardingScreens } from "../../constants/onboarding";
import { Screen } from "../ui/Screen";
import { OnboardingControls, OnboardingProgress } from "./OnboardingControls";

export function OnboardingSeven() {
  const item = onboardingScreens[6];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={6} />

        <View className="flex-1 justify-center">
          <View className="items-center">
            <View className="my-5 h-80 w-80  justify-between overflow-hidden rounded-[32px] border border-whitePrimary bg-whitePrimary/90 p-5 shadow-2xl">
              <View className="flex-row items-start justify-between gap-3">
                <View>
                  <Text className="font-ralewayExtraBold text-font10 uppercase tracking-widest text-textPrimary">
                    Property Location
                  </Text>
                  <Text className="mt-2 font-ralewayBold text-xl leading-tight text-textPrimary">
                    Makati City
                  </Text>
                </View>

                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-success/25 bg-successSurface shadow-sm">
                  <FontAwesome6
                    name="location-crosshairs"
                    size={20}
                    color={colors.text}
                  />
                </View>
              </View>

              <View className="shadow-inner relative h-24 w-full overflow-hidden rounded-2xl border border-textPrimary/10 bg-surface">
                <View className="absolute inset-0">
                  <View className="absolute left-6 top-0 h-full w-px bg-description/20" />
                  <View className="absolute left-12 top-0 h-full w-px bg-description/20" />
                  <View className="absolute left-20 top-0 h-full w-px bg-description/20" />
                  <View className="absolute right-10 top-0 h-full w-px bg-description/20" />
                  <View className="absolute left-0 top-6 h-px w-full bg-description/20" />
                  <View className="absolute left-0 top-12 h-px w-full bg-description/20" />
                  <View className="absolute bottom-6 left-0 h-px w-full bg-description/20" />
                </View>
                <View className="absolute left-7 top-5 h-8 w-16 rounded-full border border-success/25 bg-success/10" />
                <View className="absolute bottom-5 right-7 h-7 w-20 rounded-full border border-info/20 bg-info/10" />
                <View className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-5 -translate-y-5 items-center justify-center rounded-full bg-blackPrimary shadow-xl">
                  <Feather name="map-pin" size={20} color="#FFFFFF" />
                </View>
              </View>

              <View className="rounded-2xl border border-textPrimary/10 bg-whitePrimary/80 p-3 shadow-sm">
                <View className="flex-row items-center gap-2">
                  <Feather name="navigation" size={14} color="#8A77F4" />
                  <Text className="font-ralewaySemiBold text-xs text-textPrimary">
                    Pinned asset address
                  </Text>
                </View>
                <Text className="mt-1 font-ralewayBold text-sm leading-snug text-textPrimary">
                  32 Ayala Avenue, Unit 1204
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

            <Text className="text-base text-textPrimary">
              {item.description}
            </Text>
          </View>

          <View className="w-full">
            <OnboardingControls
              activeIndex={6}
              buttonTitle="Get Started"
              dotClassName="bg-info"
              fullWidthButton
              showSkip={false}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
