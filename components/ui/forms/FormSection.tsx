import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

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
          ? "gap-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5"
          : "gap-4 border-b border-slate-200 pb-6"
      }
    >
      <View
        className={`flex-row gap-3 ${isCard ? "items-center" : "items-start"}`}
      >
        <View
          className={
            isCard
              ? "h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"
              : "h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/10"
          }
        >
          <MaterialCommunityIcons
            name={icon}
            color="#2563EB"
            size={isCard ? 22 : 19}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={
              isCard
                ? "font-soraSemiBold text-xl text-[#1d1d1f]"
                : "text-lg font-bold text-[#1d1d1f]"
            }
          >
            {title}
          </Text>
          {description ? (
            <Text className="mt-1 text-sm leading-5 text-slate-600">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}
