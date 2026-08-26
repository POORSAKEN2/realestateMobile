import { Image, Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { Screen } from "../ui/Screen";
import { OnboardingControls, OnboardingProgress } from "./OnboardingControls";
import step3 from "../../assets/images/step3.png";

const leaseCardShadow = {
  elevation: 14,
  shadowColor: "#1E1F45",
  shadowOffset: { width: 0, height: 18 },
  shadowOpacity: 0.2,
  shadowRadius: 30,
};

export function OnboardingThree() {
  const item = onboardingScreens[2];

  return (
    <Screen className="bg-whitePrimary">
      <View className="flex-1 justify-between">
        <OnboardingProgress activeIndex={2} />

        <View
          className="absolute left-5 right-5 top-28 z-20 overflow-hidden rounded-[24px] border border-white/80 bg-whitePrimary/90 p-3"
          style={leaseCardShadow}
        >
          <View className="absolute left-4 right-4 top-2 h-6 rounded-full bg-white/60" />

          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-success">
              <Text className="font-ralewayExtraBold text-xs text-whitePrimary">
                JD
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-ralewayBold text-[9px] uppercase tracking-widest text-textPrimary">
                Tenant
              </Text>
              <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                Juan De La Cruz
              </Text>
            </View>
            <View className="rounded-full border border-success/25 bg-successSurface px-2.5 py-1">
              <Text className="font-ralewayExtraBold text-[9px] uppercase tracking-widest text-success">
                Active
              </Text>
            </View>
          </View>

          <View className="mt-3 gap-2">
            <View className="rounded-2xl border border-white/80 bg-white/55 px-2.5 py-2">
              <Text className="font-ralewayBold text-[9px] uppercase tracking-widest text-textPrimary">
                Property
              </Text>
              <Text className="font-ralewayExtraBold text-[11px] leading-4 text-textPrimary">
                The Shard (Calapan, Oriental Mindoro)
              </Text>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl border border-white/80 bg-white/55 px-2.5 py-2">
                <Text className="font-ralewayBold text-[9px] uppercase tracking-widest text-textPrimary">
                  Room
                </Text>
                <Text className="font-ralewayExtraBold text-xs text-textPrimary">
                  21
                </Text>
              </View>
              <View className="flex-[1.6] rounded-2xl px-2.5 py-2">
                <Text className="font-ralewayBold text-[9px] uppercase tracking-widest text-success">
                  Monthly Rent
                </Text>
                <Text className="font-ralewayExtraBold text-xs text-success">
                  50,000
                </Text>
              </View>
            </View>

            <View className="rounded-2xl border border-info/20 bg-infoSurface px-2.5 py-2">
              <Text className="font-ralewayBold text-[9px] uppercase tracking-widest text-info">
                Lease Term
              </Text>
              <Text className="font-ralewayExtraBold text-[11px] leading-4 text-textPrimary">
                May 7, 2026 - June 30, 2026
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full flex-1 items-center justify-end">
          <View className="mb-16 h-80 w-full overflow-visible">
            <Image
              className="absolute inset-0 z-0 h-full w-full rounded-2xl"
              resizeMode="cover"
              source={step3}
            />

            <View className="absolute inset-0 z-10 rounded-2xl " />
          </View>
        </View>

        <View className="gap-8">
          <View className=" mb-5">
            <Text className="my-5 max-w-[330px] font-ralewayExtraBold text-4xl leading-tight text-textPrimary">
              {item.title}
            </Text>

            <Text className="text-base leading-7 text-textPrimary">
              {item.description}
            </Text>
          </View>

          <OnboardingControls
            activeIndex={2}
            dotClassName="bg-warning"
            nextHref="/(onboarding)/screen-4"
          />
        </View>
      </View>
    </Screen>
  );
}
