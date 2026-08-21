import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { SkeletonGroup, SkeletonList, SkeletonListCard } from "./Skeleton";

export function ModuleLoadingState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <SkeletonGroup
      accessibilityLabel={`${title}. ${description}`}
      className="flex-1 gap-3"
    >
      <SkeletonList
        count={3}
        renderItem={() => <SkeletonListCard className="min-h-24" />}
      />
    </SkeletonGroup>
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
    <View className="items-center rounded-[28px] border border-dashed border-textPrimary/20 bg-white/95 p-8 shadow-sm">
      <Ionicons name={icon} color="#634CE4" size={38} />
      <Text className="mt-3 font-ralewayExtraBold text-base text-textPrimary">
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-[#6F6D6D]">
        {description}
      </Text>
    </View>
  );
}
