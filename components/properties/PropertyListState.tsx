import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

function SkeletonBlock({ className }: { className: string }) {
  return <View className={`bg-slate-200 ${className}`} />;
}

export function PropertyListSkeleton() {
  return (
    <View
      accessibilityLabel="Loading properties"
      accessibilityRole="progressbar"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
    >
      <SkeletonBlock className="h-36 w-full" />
      <View className="gap-3 p-4">
        <SkeletonBlock className="h-5 w-2/3 rounded-lg" />
        <SkeletonBlock className="h-4 w-1/2 rounded-lg" />
        <View className="mt-2 flex-row gap-3">
          <SkeletonBlock className="h-14 flex-1 rounded-2xl" />
          <SkeletonBlock className="h-14 flex-1 rounded-2xl" />
          <SkeletonBlock className="h-14 flex-1 rounded-2xl" />
        </View>
      </View>
    </View>
  );
}

export function PropertyListMessage({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onAction: () => void;
  title: string;
}) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-slate-300 bg-white p-8">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10">
        <MaterialCommunityIcons name={icon} color="#2563EB" size={28} />
      </View>
      <Text className="mt-4 text-center text-lg font-bold text-[#1d1d1f]">
        {title}
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-slate-600">
        {description}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        className="mt-5 min-h-11 items-center justify-center rounded-2xl bg-[#2563EB] px-5"
        onPress={onAction}
      >
        <Text className="text-sm font-bold text-white">{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
