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
    <View className="gap-4 border-b border-slate-200 pb-6">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB]/10">
          <MaterialCommunityIcons name={icon} color="#2563EB" size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-[#1d1d1f]">{title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-600">
            {description}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
