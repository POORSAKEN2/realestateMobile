import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../../constants/colors";
import { SkeletonBlock } from "../../ui/Skeleton";
import type {
  DashboardSummaryMetric,
  DashboardSummaryMetricTone,
  RoleDashboardSummaryCardProps,
} from "./types";
import { useDashboardSummaryLayout } from "./useDashboardSummaryLayout";

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
    label: "text-primaryContent",
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
  stacked,
  fontScale,
}: {
  isLoading: boolean;
  metric: DashboardSummaryMetric;
  stacked: boolean;
  fontScale: number;
}) {
  const tone = managerMetricStyles[metric.tone ?? "neutral"];

  return (
    <View
      className={`min-w-0 rounded-2xl border p-3 ${tone.container}`}
      style={{ minHeight: 80, ...(stacked ? {} : { flex: 1 }) }}
    >
      <View
        className="flex-row items-start justify-between gap-2"
        style={{ minHeight: 28 * fontScale }}
      >
        <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
          <Text
            allowFontScaling={false}
            className={`min-w-0 flex-1 font-ralewayExtraBold text-[11px] uppercase leading-[14px] ${tone.label}`}
            style={{ fontSize: 11 * fontScale, lineHeight: 14 * fontScale }}
          >
            {metric.label}
          </Text>
        </View>
        <View
          className={`h-5 w-5 shrink-0 items-center justify-center rounded-md ${tone.icon}`}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MaterialCommunityIcons
            accessible={false}
            name={metric.icon}
            color={tone.iconColor}
            size={14}
          />
        </View>
      </View>

      {isLoading ? (
        <View
          className="mt-1 justify-center"
          style={{ height: 22 * fontScale }}
        >
          <SkeletonBlock className="h-4 w-1/3 bg-primary/10" />
        </View>
      ) : (
        <Text
          allowFontScaling={false}
          style={{ fontSize: 18 * fontScale, lineHeight: 22 * fontScale }}
          className="mt-1 font-ralewayExtraBold text-[18px] leading-[22px] text-textPrimary"
        >
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
  const { isWide, padding, stackMetrics, fontScale, onLayout } =
    useDashboardSummaryLayout(metrics.length);
  return (
    <View
      onLayout={onLayout}
      className="overflow-hidden rounded-2xl border border-primary/15 bg-panel"
      style={[managerShadow, { padding }]}
    >
      <View
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: isWide ? 24 : 16,
        }}
      >
        <View
          className="min-w-0 gap-3"
          style={isWide ? { flex: 0.4, justifyContent: "center" } : undefined}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="max-w-full rounded-full border border-primary/10 bg-primary/10 px-2.5 py-1">
              <Text
                allowFontScaling={false}
                style={{ fontSize: 10 * fontScale, lineHeight: 14 * fontScale }}
                className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-primaryContent"
              >
                {badge}
              </Text>
            </View>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              className="h-7 w-7 items-center justify-center rounded-lg border border-primary/30 bg-panel"
            >
              <MaterialCommunityIcons
                accessible={false}
                name={icon}
                color={colors.primary}
                size={17}
              />
            </View>
          </View>

          <View className="gap-1">
            {label ? (
              <Text
                allowFontScaling={false}
                style={{ fontSize: 10 * fontScale, lineHeight: 14 * fontScale }}
                className="font-ralewayExtraBold text-[10px] uppercase tracking-wide text-description"
              >
                {label}
              </Text>
            ) : null}

            {isLoading ? (
              <View
                className="justify-center"
                style={{ height: (isWide ? 40 : 36) * fontScale }}
              >
                <SkeletonBlock className="h-7 w-1/3 rounded-xl bg-primary/10" />
              </View>
            ) : (
              <Text
                allowFontScaling={false}
                className="font-ralewayExtraBold text-[28px] text-textPrimary"
                style={{
                  fontSize: (isWide ? 32 : 28) * fontScale,
                  lineHeight: (isWide ? 40 : 36) * fontScale,
                }}
              >
                {value}
              </Text>
            )}
            {subtitle ? (
              <Text
                allowFontScaling={false}
                style={{ fontSize: 11 * fontScale, lineHeight: 16 * fontScale }}
                className="font-ralewayMedium text-[11px] leading-[16px] text-description"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="min-w-0" style={isWide ? { flex: 0.6 } : undefined}>
          {!isWide ? (
            <View className="mb-4 border-t border-primary/50" />
          ) : null}
          <View
            className="gap-3"
            style={{ flexDirection: stackMetrics ? "column" : "row" }}
          >
            {metrics.map((metric) => (
              <ManagerMetric
                isLoading={isLoading}
                key={metric.label}
                metric={metric}
                stacked={stackMetrics}
                fontScale={fontScale}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
