import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../../constants/colors";
import { SkeletonBlock } from "../../ui/Skeleton";
import type {
  DashboardSummaryMetric,
  DashboardSummaryMetricTone,
  RoleDashboardSummaryCardProps,
} from "./types";

const managerShadow = {
  elevation: 7,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 18,
};

const managerMetricStyles: Record<
  DashboardSummaryMetricTone,
  {
    container: string;
    dot: string;
    icon: string;
    iconColor: string;
    label: string;
  }
> = {
  neutral: {
    container: "border-primary/15 bg-primary/10",
    dot: "bg-primary",
    icon: "bg-primary/10",
    iconColor: colors.primary,
    label: "text-primary",
  },
  success: {
    container: "border-success/15 bg-successSurface/30",
    dot: "bg-success",
    icon: "bg-successSurface/70",
    iconColor: colors.success,
    label: "text-success",
  },
  warning: {
    container: "border-warning/15 bg-warningSurface/80",
    dot: "bg-warning",
    icon: "bg-warningSurface",
    iconColor: colors.warning,
    label: "text-warning",
  },
};

function ManagerMetric({
  isLoading,
  metric,
}: {
  isLoading: boolean;
  metric: DashboardSummaryMetric;
}) {
  const tone = managerMetricStyles[metric.tone ?? "neutral"];

  return (
    <View
      className={`h-full min-w-0 flex-1 rounded-2xl border p-3 ${tone.container}`}
    >
      <View className="flex-row items-center justify-between ">
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <Text
            adjustsFontSizeToFit
            className={`min-w-0 flex-1 font-ralewayExtraBold text-[8px] uppercase tracking-wide ${tone.label}`}
            minimumFontScale={0.75}
            numberOfLines={1}
          >
            {metric.label}
          </Text>
        </View>
        <View
          className={`h-5 w-5 items-center justify-center rounded-md ${tone.icon}`}
        >
          <MaterialCommunityIcons
            name={metric.icon}
            color={tone.iconColor}
            size={14}
          />
        </View>
      </View>

      {isLoading ? (
        <SkeletonBlock className="mt-1 h-4 w-1/3 bg-primary/10" />
      ) : (
        <Text className="font-ralewayExtraBold text-[22px] leading-[23px] text-textPrimary">
          {metric.value}
        </Text>
      )}
    </View>
  );
}

export function ManagerDashboardSummaryCard({
  badge,
  icon,
  isLoading,
  label,
  metrics,
  subtitle,
  value,
}: RoleDashboardSummaryCardProps) {
  return (
    <View
      className="flex aspect-video overflow-hidden rounded-2xl border border-primary/15 bg-white p-2"
      style={[managerShadow]}
    >
      <View className="p-4" style={{ height: "55%" }}>
        <View className="flex-row items-center justify-between gap-4">
          <View className="rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1">
            <Text className="font-ralewayExtraBold text-[9px] uppercase tracking-wider text-primary">
              {badge}
            </Text>
          </View>
          <View className="h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-white">
            <MaterialCommunityIcons
              name={icon}
              color={colors.primary}
              size={17}
            />
          </View>
        </View>

        <View className="flex-1 justify-evenly">
          {label ? (
            <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wide text-description">
              {label}
            </Text>
          ) : null}

          {isLoading ? (
            <SkeletonBlock className="mt-1 h-7 w-1/3 rounded-xl bg-primary/10" />
          ) : (
            <Text className="font-ralewayExtraBold text-[28px] leading-[30px] text-textPrimary">
              {value}
            </Text>
          )}
          {subtitle ? (
            <Text className="font-ralewayMedium text-[11px] leading-[12px] text-description">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex items-center gap-4 px-4">
        <View className="w-full border-t border-primary/50" />
        <View className="flex-row justify-center gap-4">
          {metrics.map((metric) => (
            <ManagerMetric
              isLoading={isLoading}
              key={metric.label}
              metric={metric}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
