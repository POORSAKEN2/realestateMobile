import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

export function PropertyFormSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
}) {
  return (
    <View className="gap-4 rounded-3xl border border-[#1d1d1f]/10 bg-white p-4 shadow-sm">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB]/10">
          <MaterialCommunityIcons name={icon} color="#2563EB" size={21} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-[#1d1d1f]">{title}</Text>
          <Text className="mt-1 text-xs leading-5 text-[#6F6D6D]">
            {description}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
