import Feather from "@expo/vector-icons/Feather";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../../constants/colors";

export function PropertyAdminSection({
  title,
  description,
  icon,
  accessory,
  children,
}: {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="gap-4 rounded-2xl border border-primary/15 bg-panel p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Feather name={icon} color={colors.primary} size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="font-ralewayBold text-base text-textPrimary"
          >
            {title}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-description">
            {description}
          </Text>
        </View>
        {accessory}
      </View>
      {children}
    </View>
  );
}
