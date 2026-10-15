import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../../constants/colors";
import {
  useThemeColors,
  useWorkspacePresentation,
} from "../../../context/WorkspacePresentationContext";
import { SkeletonBlock } from "../../ui/Skeleton";
import type {
  DashboardSummaryMetric,
  RoleDashboardSummaryCardProps,
} from "./types";
import { useDashboardSummaryLayout } from "./useDashboardSummaryLayout";

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
  stacked,
  fontScale,
}: {
  isLoading: boolean;
  metric: DashboardSummaryMetric;
  stacked: boolean;
  fontScale: number;
}) {
  const { resolvedTheme } = useWorkspacePresentation();
  const palette = useThemeColors();
  const isDark = resolvedTheme === "dark";
  return (
    <View
      className={`min-w-0 justify-center overflow-hidden rounded-2xl border p-3 ${isDark ? "border-primary/20 bg-primary/5" : "border-white/15 bg-textPrimary/10"}`}
      style={{ minHeight: 80, ...(stacked ? {} : { flex: 1 }) }}
    >
      <View
        accessibilityElementsHidden
        className="absolute -bottom-2 -right-2"
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={{ opacity: 0.08 }}
      >
        <MaterialCommunityIcons
          accessible={false}
          name={metric.icon}
          color={isDark ? palette.primary : palette.whitePrimary}
          size={56}
        />
      </View>
      <View className="z-10 min-w-0">
        <Text
          allowFontScaling={false}
          className={`font-ralewayBold text-[11px] uppercase leading-[14px] ${isDark ? "text-description" : "text-white"}`}
          style={{
            fontSize: 11 * fontScale,
            lineHeight: 14 * fontScale,
            minHeight: 28 * fontScale,
          }}
        >
          {metric.label}
        </Text>
        {isLoading ? (
          <View
            className="mt-1 justify-center"
            style={{ height: 22 * fontScale }}
          >
            <SkeletonBlock
              className={`h-4 w-2/3 ${isDark ? "bg-primary/20" : "bg-accent/20"}`}
            />
          </View>
        ) : (
          <Text
            allowFontScaling={false}
            className={`mt-1 font-ralewayExtraBold text-[18px] leading-[22px] ${isDark ? "text-textPrimary" : "text-white"}`}
            style={{ fontSize: 18 * fontScale, lineHeight: 22 * fontScale }}
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
  isLoading,
  label,
  metrics,
  value,
}: RoleDashboardSummaryCardProps) {
  const { resolvedTheme } = useWorkspacePresentation();
  const palette = useThemeColors();
  const isDark = resolvedTheme === "dark";
  const { isWide, padding, stackMetrics, fontScale, onLayout } =
    useDashboardSummaryLayout(metrics.length);
  return (
    <View
      onLayout={onLayout}
      className={`overflow-hidden rounded-2xl border border-primary/25 ${isDark ? "bg-panel" : "bg-secondary"}`}
      style={{
        padding,
        ...adminShadow,
        shadowColor: palette.secondary,
        shadowOpacity: isDark ? 0.08 : 0.24,
      }}
    >
      <View
        className={`absolute -right-10 -top-14 h-36 w-36 rounded-full ${isDark ? "bg-primary/10" : "bg-primary/55"}`}
      />
      <View className="absolute -bottom-14 -left-10 h-28 w-28 rounded-full bg-accent/10" />
      {!isDark ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-textPrimary/25"
        />
      ) : null}

      <View
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: isWide ? 24 : 16,
        }}
      >
        <View
          className="min-w-0"
          style={isWide ? { flex: 0.4, justifyContent: "center" } : undefined}
        >
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text
              allowFontScaling={false}
              className={`shrink font-ralewayBold text-[11px] uppercase tracking-wider ${isDark ? "text-primary" : "text-white"}`}
              style={{ fontSize: 11 * fontScale, lineHeight: 15 * fontScale }}
            >
              {label}
            </Text>
            <View
              className={`max-w-full rounded-full px-3 py-1.5 ${isDark ? "bg-primary/10" : "bg-textPrimary/20"}`}
            >
              <Text
                allowFontScaling={false}
                className={`font-ralewayExtraBold text-[10px] uppercase tracking-wider ${isDark ? "text-primary" : "text-white"}`}
                style={{ fontSize: 10 * fontScale, lineHeight: 14 * fontScale }}
              >
                {badge}
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View
              className="mt-1 justify-center"
              style={{ height: (isWide ? 44 : 40) * fontScale }}
            >
              <SkeletonBlock
                className={`h-9 w-4/5 rounded-xl ${isDark ? "bg-primary/20" : "bg-accent/20"}`}
              />
            </View>
          ) : (
            <Text
              allowFontScaling={false}
              className={`mt-1 font-ralewayExtraBold text-[32px] ${isDark ? "text-textPrimary" : "text-white"}`}
              style={{
                fontSize: (isWide ? 36 : 32) * fontScale,
                lineHeight: (isWide ? 44 : 40) * fontScale,
              }}
            >
              {value}
            </Text>
          )}
        </View>

        <View
          className="min-w-0 gap-3"
          style={{
            flexDirection: stackMetrics ? "column" : "row",
            ...(isWide ? { flex: 0.6 } : {}),
          }}
        >
          {metrics.map((metric) => (
            <AdminMetric
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
  );
}
