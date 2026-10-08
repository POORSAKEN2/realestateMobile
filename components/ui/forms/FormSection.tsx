import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { colors } from "../../../constants/colors";

type FormSectionProps = {
  children: ReactNode;
  description?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  variant?: "divider" | "card";
};

export function FormSection({
  children,
  description,
  icon,
  title,
  variant = "divider",
}: FormSectionProps) {
  const isCard = variant === "card";

  return (
    <View
      className={
        isCard
          ? "gap-5 rounded-[24px] border border-textPrimary/10 bg-panel p-4 shadow-sm shadow-textPrimary/5"
          : "gap-4 border-b border-textPrimary/10 pb-6"
      }
    >
      <View
        className={`flex-row gap-3 ${isCard ? "items-center" : "items-start"}`}
      >
        <View
          className={
            isCard
              ? "h-12 w-12 items-center justify-center rounded-2xl bg-iconSurface"
              : "h-9 w-9 items-center justify-center rounded-xl bg-iconSurface"
          }
        >
          <MaterialCommunityIcons
            name={icon}
            color={colors.primary}
            size={isCard ? 22 : 19}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={
              isCard
                ? "font-ralewayBold text-xl text-textPrimary"
                : "font-ralewayExtraBold text-lg text-textPrimary"
            }
          >
            {title}
          </Text>
          {description ? (
            <Text className="mt-1 text-sm leading-5 text-description">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}
