import Feather from "@expo/vector-icons/Feather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polyline,
  Stop,
} from "react-native-svg";

import {
  fetchPortfolioHistory,
  fetchPortfolioStats,
} from "../../api/analytics";
import { useProperties } from "../../hooks/api/useProperties";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../hooks/useAuth";
import type { PortfolioSnapshot, Property } from "../../types";

type MetricCard = {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  toneColor: string;
  iconColor: string;
};

type DistributionSlice = {
  label: string;
  value: number;
  color: string;
};

const distributionColors = [
  "#2563EB",
  "#0F766E",
  "#F59E0B",
  "#E11D48",
  "#7C3AED",
  "#52525B",
];

const formatPesoValue = (value: number = 0) => {
  if (value >= 1_000_000_000) return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value === 0) return "₱0";

  return `₱${value.toLocaleString()}`;
};

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
    <View className="mt-4 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/10">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="font-soraSemiBold text-base text-zinc-950">
            Portfolio Performance
          </Text>
          <Text className="mt-1 text-xs text-zinc-500">Total value trend</Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
          <Feather name="activity" size={18} color="#2563EB" />
        </View>
      </View>

      <View className="mt-4 items-center overflow-hidden rounded-3xl bg-slate-50">
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
                  <Stop offset="0" stopColor="#2563EB" stopOpacity="0.24" />
                  <Stop offset="1" stopColor="#2563EB" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Path d={areaPath} fill="url(#performanceFill)" />
              <Polyline
                points={linePoints}
                fill="none"
                stroke="#2563EB"
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
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth={3}
                />
              ))}
            </Svg>
            <View className="-mt-6 w-full flex-row justify-between px-5 pb-4">
              {sortedHistory.map((snapshot) => (
                <Text
                  key={snapshot.id}
                  className="text-[10px] font-medium text-slate-400"
                >
                  {formatSnapshotLabel(snapshot)}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <View className="h-48 items-center justify-center">
            <Text className="font-soraMedium text-xs text-zinc-400">
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
    <View className="mt-4 rounded-[28px] border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/10">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1 pr-4">
          <Text className="font-soraSemiBold text-base uppercase text-zinc-950">
            Portfolio Distribution
          </Text>
          <Text className="mt-1 text-xs text-zinc-500">
            Allocation by asset category
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <MaterialCommunityIcons
            name="chart-donut"
            size={19}
            color="#0F766E"
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
                stroke="#E5E7EB"
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
            <View className="h-[172px] w-[172px] items-center justify-center rounded-full bg-slate-50">
              <Text className="font-soraMedium text-xs text-slate-400">
                No assets
              </Text>
            </View>
          )}
          {totalValue > 0 && (
            <View className="absolute items-center">
              <Text className="font-soraSemiBold text-lg text-zinc-950">
                {slices.length}
              </Text>
              <Text className="text-[10px] uppercase text-zinc-400">
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
                        className="min-w-0 flex-1 font-soraMedium text-xs text-zinc-700"
                        numberOfLines={1}
                      >
                        {slice.label}
                      </Text>
                    </View>
                    <Text className="font-soraSemiBold text-xs text-zinc-950">
                      {percent.toFixed(0)}%
                    </Text>
                  </View>
                  <Text className="mt-0.5 pl-4 text-[10px] text-zinc-400">
                    {formatPesoValue(slice.value)}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text className="font-soraMedium text-xs text-zinc-400">
              Add properties to see allocation.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken;
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["analytics", "stats", accessToken],
    queryFn: () => fetchPortfolioStats(accessToken),
  });
  const { data: history = [] } = useQuery({
    queryKey: ["analytics", "history", accessToken],
    queryFn: () => fetchPortfolioHistory(accessToken),
  });
  const { useList } = useProperties();
  const { data: properties = [] } = useList();

  const metricCards = useMemo<MetricCard[]>(
    () => [
      {
        label: "Total Asset Value",
        value: isLoadingStats ? "..." : formatPesoValue(stats?.total_value),
        icon: "briefcase",
        toneColor: "#EFF6FF",
        iconColor: "#2563EB",
      },
      {
        label: "Average Yield",
        value: isLoadingStats
          ? "..."
          : `${Number(stats?.avg_yield ?? 0).toFixed(1)}%`,
        icon: "percent",
        toneColor: "#ECFDF5",
        iconColor: "#059669",
      },
      {
        label: "Total Arrears",
        value: isLoadingStats ? "..." : formatPesoValue(stats?.total_arrears),
        icon: "clock",
        toneColor: "#FFFBEB",
        iconColor: "#D97706",
      },
      {
        label: "Net Operating Income",
        value: isLoadingStats
          ? "..."
          : formatPesoValue(stats?.net_operating_income),
        icon: "trending-up",
        toneColor: "#F0FDFA",
        iconColor: "#0F766E",
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

  return (
    <Screen className="bg-[#F8FAFC]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-slate-400">
              Portfolio Intelligence
            </Text>
            <Text className="font-soraSemiBold text-3xl text-[#1d1d1f]">
              Analytics
            </Text>
          </View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] shadow-md shadow-blue-200">
            <Feather name="bar-chart-2" size={22} color="#FFFFFF" />
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap">
          {metricCards.map((card) => (
            <View key={card.label} className="w-1/2 p-1.5">
              <View className="min-h-[132px] rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/10">
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: card.toneColor }}
                >
                  <Feather name={card.icon} size={18} color={card.iconColor} />
                </View>
                <Text
                  className="mt-4 font-soraSemiBold text-lg text-zinc-950"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {card.value}
                </Text>
                <Text className="mt-1 text-[11px] font-medium uppercase leading-4 text-zinc-400">
                  {card.label}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <PerformanceChart history={history} />
        <DistributionChart slices={distributionSlices} />
      </ScrollView>
    </Screen>
  );
}
