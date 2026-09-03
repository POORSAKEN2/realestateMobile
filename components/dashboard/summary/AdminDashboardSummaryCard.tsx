import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../../constants/colors";
import { SkeletonBlock } from "../../ui/Skeleton";
import type {
  DashboardSummaryMetric,
  RoleDashboardSummaryCardProps,
} from "./types";

const adminShadow = {
  elevation: 10,
  shadowColor: colors.secondary,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.24,
  shadowRadius: 16,
};

function AdminMetric({
  isLoading,
  metric,
}: {
  isLoading: boolean;
  metric: DashboardSummaryMetric;
}) {
  return (
    <View
      className="min-w-0 flex-1 justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1.5"
      style={{ aspectRatio: 16 / 9 }}
    >
      <View
        accessibilityElementsHidden
        className="absolute -bottom-2 -right-2"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={{ opacity: 0.14 }}
      >
        <MaterialCommunityIcons
          accessible={false}
          name={metric.icon}
          color={colors.whitePrimary}
          size={56}
        />
      </View>
      <View className="z-10 min-w-0">
        <Text
          adjustsFontSizeToFit
          className="font-ralewayBold text-[9px] uppercase leading-[10px] text-accent"
          minimumFontScale={0.75}
          numberOfLines={2}
        >
          {metric.label}
        </Text>
        {isLoading ? (
          <SkeletonBlock className="mt-0.5 h-4 w-2/3 bg-accent/20" />
        ) : (
          <Text
            adjustsFontSizeToFit
            className="mt-0.5 font-ralewayExtraBold text-base leading-[18px] text-white"
            numberOfLines={1}
          >
            {metric.value}
          </Text>
        )}
      </View>
    </View>
  );
}

export function AdminDashboardSummaryCard({
  badge,
  icon,
  isLoading,
  label,
  metrics,
  value,
}: RoleDashboardSummaryCardProps) {
  return (
    <View
      className="overflow-hidden rounded-2xl border border-primary/25 bg-secondary px-4 py-6"
      style={adminShadow}
    >
      <View className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-primary/55" />
      <View className="absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-accent/10" />

      <View className="flex-row items-center justify-between gap-4">
        {/* <View className="h-10 w-10 items-center justify-center rounded-2xl border border-accent/30 bg-white/10">
          <MaterialCommunityIcons name={icon} color={colors.accent} size={21} />
        </View> */}
        <Text className="font-ralewayBold text-[10px] uppercase tracking-wider text-accent/80">
          {label}
        </Text>
        <View className="rounded-full bg-textPrimary/20 px-3 py-1.5">
          <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-white">
            {badge}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <SkeletonBlock className="mt-2 h-9 w-4/5 rounded-xl bg-accent/20" />
      ) : (
        <Text
          adjustsFontSizeToFit
          className="mt-1 font-ralewayExtraBold text-[32px] text-white"
          numberOfLines={1}
        >
          {value}
        </Text>
      )}

      <View className="mt-4 flex-row gap-3">
        {metrics.map((metric) => (
          <AdminMetric
            isLoading={isLoading}
            key={metric.label}
            metric={metric}
          />
        ))}
      </View>
    </View>
  );
}
