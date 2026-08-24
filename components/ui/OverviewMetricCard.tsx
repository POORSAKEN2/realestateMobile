import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { SkeletonBlock } from "./Skeleton";

type OverviewSubMetric = {
  detail?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  progress?: number;
  value: string;
};

function MetricIcon({
  icon,
  large = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  large?: boolean;
}) {
  return (
    <View
      className={`shrink-0 items-center justify-center rounded-full bg-primary/10 ${
        large ? "h-14 w-14" : "h-11 w-11"
      }`}
    >
      <Ionicons name={icon} color={colors.primary} size={large ? 27 : 20} />
    </View>
  );
}

function SubMetric({
  isLoading,
  metric,
}: {
  isLoading: boolean;
  metric: OverviewSubMetric;
}) {
  const hasProgress = metric.progress !== undefined;
  const boundedProgress = Math.min(100, Math.max(0, metric.progress ?? 0));

  return (
    <View className=" min-h-24 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-300/40">
      <View className="flex-1 flex-row items-start gap-3">
        <MetricIcon icon={metric.icon} />
        <View className="min-w-0 flex-1 self-stretch">
          <Text className="font-ralewaySemiBold text-xs leading-4 text-description">
            {metric.label}
          </Text>
          {isLoading ? (
            <SkeletonBlock className="mt-3 h-4 w-3/4" />
          ) : (
            <Text
              adjustsFontSizeToFit
              className="font-ralewayBold text-2xl leading-7 text-textPrimary"
              numberOfLines={1}
            >
              {metric.value}
            </Text>
          )}
          <View className="min-h-10 justify-start">
            {hasProgress ? (
              isLoading ? (
                <>
                  <SkeletonBlock className="mt-2 h-1.5 w-full" />
                  <SkeletonBlock className="h-3 w-10 self-end" />
                </>
              ) : (
                <>
                  <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${boundedProgress}%` }}
                    />
                  </View>
                  <Text className="text-right font-ralewayMedium text-xs text-slate-500">
                    {metric.detail ?? `${Math.round(boundedProgress)}%`}
                  </Text>
                </>
              )
            ) : metric.detail ? (
              isLoading ? (
                <SkeletonBlock className="h-3 w-1/2" />
              ) : (
                <Text className="font-ralewayMedium text-xs text-slate-500">
                  {metric.detail}
                </Text>
              )
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export function OverviewMetricCard({
  icon,
  isLoading,
  label,
  metrics,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isLoading: boolean;
  label: string;
  metrics: OverviewSubMetric[];
  value: string;
}) {
  return (
    <View className="gap-3">
      <View className="min-h-32 flex-row items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-300/40">
        <MetricIcon icon={icon} large />

        <View className="min-w-0 flex-1">
          <Text className="font-ralewayMedium text-description">{label}</Text>
          {isLoading ? (
            <SkeletonBlock className="mt-2 h-9 w-4/5 rounded-xl" />
          ) : (
            <Text
              adjustsFontSizeToFit
              className="mt-1 font-ralewayBold text-3xl leading-9 text-textPrimary"
              numberOfLines={1}
            >
              {value}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row gap-3">
        {metrics.map((metric) => (
          <SubMetric isLoading={isLoading} key={metric.label} metric={metric} />
        ))}
      </View>
    </View>
  );
}
