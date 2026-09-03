import Feather from "@expo/vector-icons/Feather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polyline,
  Stop,
} from "react-native-svg";

import { PullToRefreshScrollView } from "../../components/ui/PullToRefreshScrollView";
import { useProperties } from "../../hooks/api/useProperties";
import { usePortfolioAnalytics } from "../../hooks/api/usePortfolioAnalytics";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { Screen } from "../../components/ui/Screen";
import { SkeletonBlock, SkeletonGroup } from "../../components/ui/Skeleton";
import { useAuth } from "../../hooks/useAuth";
import type { PortfolioSnapshot, Property } from "../../types";
import { formatPesoValue } from "../../utils/dashboard/dashboardHelpers";
import { colors } from "../../constants/colors";
import { shareFinancialSummaryCsv } from "../../api/reports";

type MetricCard = {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
};

type DistributionSlice = {
  label: string;
  value: number;
  color: string;
};

const distributionColors = [
  colors.secondary,
  colors.primary,
  colors.accent,
  colors.text,
  colors.description,
];

const formatAssetType = (type?: Property["type"]) => type ?? "Uncategorized";

const formatSnapshotLabel = (snapshot: PortfolioSnapshot) => {
  const date = new Date(snapshot.snapshot_date);

  if (Number.isNaN(date.getTime())) return snapshot.snapshot_date;

  return date.toLocaleDateString("en-US", { month: "short" });
};

function PerformanceChart({ history }: { history: PortfolioSnapshot[] }) {
  const width = 320;
  const height = 190;
  const paddingX = 24;
  const paddingY = 26;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const sortedHistory = [...history]
    .sort(
      (a, b) =>
        new Date(a.snapshot_date).getTime() -
        new Date(b.snapshot_date).getTime(),
    )
    .slice(-6);
  const values = sortedHistory.map((snapshot) => snapshot.total_value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const points = values.map((value, index) => {
    const x =
      paddingX +
      (sortedHistory.length <= 1
        ? chartWidth / 2
        : (index / (sortedHistory.length - 1)) * chartWidth);
    const y =
      paddingY + chartHeight - ((value - minValue) / range) * chartHeight;

    return { x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `M ${points[0].x} ${height - paddingY} L ${linePoints} L ${
          points[points.length - 1].x
        } ${height - paddingY} Z`
      : "";

  return (
    <View className="mt-4 rounded-[28px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-ralewayBold text-base text-textPrimary">
            Portfolio Performance
          </Text>
          <Text className="mt-1 text-xs text-description">
            Total value trend
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <Feather name="activity" size={18} color={colors.primary} />
        </View>
      </View>

      <View className="mt-4 items-center overflow-hidden rounded-3xl bg-primary/10">
        {sortedHistory.length > 0 ? (
          <>
            <Svg
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
            >
              <Defs>
                <LinearGradient
                  id="performanceFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <Stop
                    offset="0"
                    stopColor={colors.primary}
                    stopOpacity="0.24"
                  />
                  <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={areaPath} fill="url(#performanceFill)" />
              <Polyline
                points={linePoints}
                fill="none"
                stroke={colors.primary}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
              />
              {points.map((point, index) => (
                <Circle
                  key={`${point.x}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={5}
                  fill={colors.whitePrimary}
                  stroke={colors.primary}
                  strokeWidth={3}
                />
              ))}
            </Svg>
            <View className="-mt-6 w-full flex-row justify-between px-5 pb-4">
              {sortedHistory.map((snapshot) => (
                <Text
                  key={snapshot.id}
                  className="font-ralewaySemiBold text-[10px] text-description"
                >
                  {formatSnapshotLabel(snapshot)}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <View className="h-48 items-center justify-center">
            <Text className="font-ralewaySemiBold text-xs text-description">
              No performance history yet
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function DistributionChart({ slices }: { slices: DistributionSlice[] }) {
  const size = 172;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalValue = slices.reduce((sum, slice) => sum + slice.value, 0);
  let cumulativePercent = 0;

  return (
    <View className="mt-4 rounded-[28px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1 pr-4">
          <Text className="font-ralewayBold text-base uppercase text-textPrimary">
            Portfolio Distribution
          </Text>
          <Text className="mt-1 text-xs text-description">
            Allocation by asset category
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <MaterialCommunityIcons
            name="chart-donut"
            size={19}
            color={colors.primary}
          />
        </View>
      </View>

      <View className="mt-5 flex-row items-center gap-5">
        <View className="items-center justify-center">
          {totalValue > 0 ? (
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors.surface}
                strokeWidth={strokeWidth}
              />
              {slices.map((slice) => {
                const percent = slice.value / totalValue;
                const dashLength = percent * circumference;
                const dashOffset = circumference * (1 - cumulativePercent);

                cumulativePercent += percent;

                return (
                  <Circle
                    key={slice.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                    stroke={slice.color}
                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                    strokeDashoffset={dashOffset}
                    strokeWidth={strokeWidth}
                  />
                );
              })}
            </Svg>
          ) : (
            <View className="h-[172px] w-[172px] items-center justify-center rounded-full bg-primary/10">
              <Text className="font-ralewaySemiBold text-xs text-description">
                No assets
              </Text>
            </View>
          )}
          {totalValue > 0 && (
            <View className="absolute items-center">
              <Text className="font-ralewayBold text-lg text-textPrimary">
                {slices.length}
              </Text>
              <Text className="text-[10px] uppercase text-description">
                Categories
              </Text>
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1 gap-3">
          {slices.length > 0 ? (
            slices.map((slice) => {
              const percent =
                totalValue > 0 ? (slice.value / totalValue) * 100 : 0;

              return (
                <View key={slice.label}>
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <Text
                        className="min-w-0 flex-1 font-ralewaySemiBold text-xs text-textPrimary"
                        numberOfLines={1}
                      >
                        {slice.label}
                      </Text>
                    </View>
                    <Text className="font-ralewayBold text-xs text-textPrimary">
                      {percent.toFixed(0)}%
                    </Text>
                  </View>
                  <Text className="mt-0.5 pl-4 text-[10px] text-description">
                    {formatPesoValue(slice.value)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="font-ralewaySemiBold text-xs text-description">
              Add properties to see allocation.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function AnalyticsLoadingState() {
  return (
    <SkeletonGroup accessibilityLabel="Loading portfolio analytics">
      <View className="mt-6 flex-row flex-wrap">
        {Array.from({ length: 4 }, (_, index) => (
          <View className="w-1/2 p-1.5" key={index}>
            <View className="min-h-[132px] rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
              <SkeletonBlock className="h-10 w-10 rounded-2xl bg-primary/10" />
              <SkeletonBlock className="mt-4 h-5 w-4/5 bg-primary/15" />
              <View className="mt-2 gap-1.5">
                <SkeletonBlock className="h-2.5 w-3/4" />
                <SkeletonBlock className="h-2.5 w-1/2" />
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-4 rounded-[28px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
        <View className="flex-row items-center justify-between">
          <View className="gap-2">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-3 w-24" />
          </View>
          <SkeletonBlock className="h-10 w-10 rounded-2xl bg-primary/10" />
        </View>
        <View className="mt-4 h-48 overflow-hidden rounded-3xl bg-primary/10 px-5 pb-4 pt-5">
          <View className="flex-1 flex-row items-end justify-between gap-3">
            {["h-1/3", "h-1/2", "h-2/5", "h-3/4", "h-3/5", "h-full"].map(
              (height, index) => (
                <SkeletonBlock
                  className={`w-3 rounded-full bg-primary/20 ${height}`}
                  key={index}
                />
              ),
            )}
          </View>
          <View className="mt-4 flex-row justify-between">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock
                className="h-2 w-6 rounded-full bg-primary/20"
                key={index}
              />
            ))}
          </View>
        </View>
      </View>

      <View className="mt-4 rounded-[28px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 gap-2 pr-4">
            <SkeletonBlock className="h-5 w-44 max-w-full" />
            <SkeletonBlock className="h-3 w-36" />
          </View>
          <SkeletonBlock className="h-10 w-10 rounded-2xl bg-primary/10" />
        </View>
        <View className="mt-5 flex-row items-center gap-5">
          <View className="h-[172px] w-[172px] items-center justify-center rounded-full bg-primary/10">
            <View className="h-28 w-28 items-center justify-center rounded-full bg-white">
              <SkeletonBlock className="h-5 w-8 bg-primary/15" />
              <SkeletonBlock className="mt-2 h-2.5 w-14" />
            </View>
          </View>
          <View className="min-w-0 flex-1 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <View className="gap-1.5" key={index}>
                <View className="flex-row items-center gap-2">
                  <SkeletonBlock className="h-2.5 w-2.5 rounded-full bg-primary/20" />
                  <SkeletonBlock className="h-3 flex-1" />
                  <SkeletonBlock className="h-3 w-7" />
                </View>
                <SkeletonBlock className="ml-[18px] h-2 w-12" />
              </View>
            ))}
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

export default function AnalyticsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const {
    stats,
    history,
    isLoading: isLoadingAnalytics,
    isLoadingStats,
    refetch: refetchAnalytics,
  } = usePortfolioAnalytics(accessToken);
  const { useList } = useProperties();
  const {
    data: properties = [],
    isLoading: isLoadingProperties,
    refetch: refetchProperties,
  } = useList();
  const isInitialLoading = isLoadingAnalytics || isLoadingProperties;

  const metricCards = useMemo<MetricCard[]>(
    () => [
      {
        label: "Total Asset Value",
        value: isLoadingStats ? "..." : formatPesoValue(stats?.total_value),
        icon: "briefcase",
      },
      {
        label: "Average Yield",
        value: isLoadingStats
          ? "..."
          : `${Number(stats?.avg_yield ?? 0).toFixed(1)}%`,
        icon: "percent",
      },
      {
        label: "Total Arrears",
        value: isLoadingStats ? "..." : formatPesoValue(stats?.total_arrears),
        icon: "clock",
      },
      {
        label: "Net Operating Income",
        value: isLoadingStats
          ? "..."
          : formatPesoValue(stats?.net_operating_income),
        icon: "trending-up",
      },
    ],
    [isLoadingStats, stats],
  );

  const distributionSlices = useMemo<DistributionSlice[]>(() => {
    const totalsByType = properties.reduce<Record<string, number>>(
      (totals, property) => {
        const type = formatAssetType(property.type);

        totals[type] = (totals[type] ?? 0) + property.value;

        return totals;
      },
      {},
    );

    return Object.entries(totalsByType)
      .sort(([, valueA], [, valueB]) => valueB - valueA)
      .map(([label, value], index) => ({
        label,
        value,
        color: distributionColors[index % distributionColors.length],
      }));
  }, [properties]);

  async function refreshAnalytics() {
    await Promise.all([refetchAnalytics(), refetchProperties()]);
  }

  return (
    <Screen className="bg-surface">
      <ModuleHeader
        action={
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-md shadow-primary/20">
            <Feather name="bar-chart-2" size={22} color={colors.primary} />
          </View>
        }
        eyebrow="Portfolio Intelligence"
        leading={
          <SecondaryBackButton
            accessibilityLabel="Back from analytics"
            variant="secondary"
          />
        }
        title="Analytics"
      />

      <PullToRefreshScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        onRefresh={refreshAnalytics}
      >
        {isInitialLoading ? (
          <AnalyticsLoadingState />
        ) : (
          <>
            <View className="mt-6 flex-row flex-wrap">
              {metricCards.map((card) => (
                <View key={card.label} className="w-1/2 p-1.5">
                  <View className="min-h-[132px] rounded-[24px] border border-primary/20 bg-white p-4 shadow-sm shadow-primary/10">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      <Feather
                        name={card.icon}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      className="mt-4 font-ralewayBold text-lg text-textPrimary"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {card.value}
                    </Text>
                    <Text className="mt-1 font-ralewaySemiBold text-[11px] uppercase leading-4 text-description">
                      {card.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <PerformanceChart history={history} />
            <DistributionChart slices={distributionSlices} />

            {/* Financial Summary Export */}
            <View className="mt-4 rounded-3xl border border-primary/20 bg-white p-5 shadow-sm shadow-primary/5">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-ralewayBold text-base text-textPrimary">
                    Financial Summary Report
                  </Text>
                  <Text className="mt-0.5 text-xs text-description">
                    Export verified revenue, operating costs, and NOI
                  </Text>
                </View>
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Feather name="file-text" size={18} color={colors.primary} />
                </View>
              </View>

              <View className="mt-4 flex-row gap-2.5">
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-primary"
                  onPress={async () => {
                    try {
                      await shareFinancialSummaryCsv();
                    } catch (err) {
                      Alert.alert(
                        "Export Failed",
                        err instanceof Error ? err.message : "Could not export report.",
                      );
                    }
                  }}
                >
                  <Feather name="download" size={16} color="#FFFFFF" />
                  <Text className="ml-2 font-ralewayBold text-xs text-white">
                    Export CSV
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="h-12 px-4 flex-row items-center justify-center rounded-2xl border border-primary/20 bg-primary/5"
                  onPress={() => {
                    Alert.alert(
                      "PDF Export Notice",
                      "PDF report generator is being provisioned. Please use the server-reconciled CSV format.",
                    );
                  }}
                >
                  <Text className="font-ralewayBold text-xs text-primary">
                    PDF Notice
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </PullToRefreshScrollView>
    </Screen>
  );
}
