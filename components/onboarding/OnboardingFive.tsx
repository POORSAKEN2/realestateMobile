import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { onboardingScreens } from "../../constants/onboarding";
import { OnboardingControls } from "./OnboardingControls";
import { OnboardingPageLayout } from "./OnboardingPageLayout";

const folderRows = [
  {
    label: "Properties",
    iconColor: "#8A77F4",
    iconBg: "bg-successSurface",
    lineClassName: "bg-success",
    meta: "18 files",
  },
  {
    label: "Bookings",
    iconColor: "#2563EB",
    iconBg: "bg-infoSurface",
    lineClassName: "bg-info",
    meta: "6 pending",
  },
  {
    label: "Documents",
    iconColor: "#8A77F4",
    iconBg: "bg-primary/10",
    lineClassName: "bg-primary/45",
    meta: "Updated",
  },
];

export function OnboardingFive() {
  const item = onboardingScreens[4];

  return (
    <OnboardingPageLayout
      activeIndex={4}
      copy={
        <View className="mb-5">
          <Text className="my-5 font-ralewayExtraBold text-4xl leading-tight text-blackPrimary">
            {item.title}
          </Text>

          <Text className="text-base leading-7 text-textPrimary">
            {item.description}
          </Text>
        </View>
      }
      footer={
        <OnboardingControls activeIndex={4} nextHref="/(onboarding)/screen-6" />
      }
      visual={
        <View className="w-full flex-1 items-center justify-center">
          <View className="h-80 w-80 overflow-hidden rounded-[32px] border border-textPrimary/10 bg-whitePrimary/95 p-5 shadow-2xl">
            <View className="absolute inset-0">
              <View className="absolute left-6 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute left-12 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute left-20 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute left-28 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute right-16 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute right-8 top-0 h-full w-px bg-textPrimary/10" />
              <View className="absolute left-0 top-7 h-px w-full bg-textPrimary/10" />
              <View className="absolute left-0 top-14 h-px w-full bg-textPrimary/10" />
              <View className="absolute left-0 top-24 h-px w-full bg-textPrimary/10" />
              <View className="absolute left-0 top-36 h-px w-full bg-textPrimary/10" />
              <View className="absolute left-0 top-48 h-px w-full bg-textPrimary/10" />
              <View className="absolute left-0 top-60 h-px w-full bg-textPrimary/10" />
              <View className="absolute bottom-8 left-0 h-px w-full bg-textPrimary/10" />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-ralewayExtraBold text-font10 uppercase tracking-widest text-textPrimary">
                  Workspace
                </Text>
                <Text className="mt-2 font-ralewayBold text-xl text-blackPrimary">
                  Organized files
                </Text>
              </View>

              <View className="h-10 w-10 items-center justify-center rounded-2xl border border-success/25 bg-successSurface shadow-sm">
                <Feather name="archive" size={18} color="#8A77F4" />
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
                      className={`h-12 w-12 items-center justify-center rounded-2xl border border-textPrimary/10 ${row.iconBg}`}
                    >
                      <Feather name="folder" size={24} color={row.iconColor} />
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="font-ralewayBold text-base text-blackPrimary">
                          {row.label}
                        </Text>
                        <Text className="font-ralewaySemiBold text-font10 uppercase tracking-widest text-textPrimary">
                          {row.meta}
                        </Text>
                      </View>
                      <View className="mt-2 gap-1.5">
                        <View
                          className={`h-2 w-4/5 rounded-full ${row.lineClassName}`}
                        />
                        <View className="h-2 w-3/5 rounded-full bg-description/20" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      }
    />
  );
}
