import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, View } from "react-native";

export function ModuleLoadingState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <View className="flex-1 justify-center rounded-[28px] border border-[#1d1d1f]/10 bg-white p-6 shadow-sm">
      <View className="items-center">
        <ActivityIndicator color="#2563EB" />
        <Text className="mt-3 text-sm font-semibold text-[#1d1d1f]">
          {title}
        </Text>
        <Text className="mt-1 text-center text-xs leading-5 text-[#6F6D6D]">
          {description}
        </Text>
      </View>
      <View className="mt-6 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <View className="h-16 rounded-2xl bg-[#1d1d1f]/5" key={index} />
        ))}
      </View>
    </View>
  );
}

export function ModuleEmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="items-center rounded-[28px] border border-dashed border-[#1d1d1f]/20 bg-white/95 p-8 shadow-sm">
      <Ionicons name={icon} color="#2563EB" size={38} />
      <Text className="mt-3 text-base font-bold text-[#1d1d1f]">{title}</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
        {description}
      </Text>
    </View>
  );
}
