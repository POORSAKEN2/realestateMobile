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
  compact = false,
  icon,
  large = false,
}: {
  compact?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  large?: boolean;
}) {
  return (
    <View
      className={`shrink-0 items-center justify-center rounded-full bg-primary/10 ${
        large ? "h-14 w-14" : compact ? "h-8 w-8" : "h-11 w-11"
      }`}
    >
      <Ionicons
        name={icon}
        color={colors.primary}
        size={large ? 27 : compact ? 16 : 20}
      />
    </View>
  );
}

function SubMetric({
  compact = false,
  isLoading,
  metric,
}: {
  compact?: boolean;
  isLoading: boolean;
  metric: OverviewSubMetric;
}) {
  const hasProgress = metric.progress !== undefined;
  const boundedProgress = Math.min(100, Math.max(0, metric.progress ?? 0));

  return (
    <View
      className={`flex-1 rounded-2xl border border-textPrimary/10 bg-white shadow-sm shadow-textPrimary/10 ${
        compact ? "min-h-0 p-3" : "min-h-24 p-4"
      }`}
    >
      <View
        className={`flex-1 ${compact ? "justify-center" : "flex-row items-start gap-3"}`}
      >
        <View className={compact ? "flex-row items-center gap-2" : ""}>
          <MetricIcon compact={compact} icon={metric.icon} />
          {compact ? (
            <Text className="min-w-0 flex-1 font-ralewaySemiBold text-[11px] leading-4 text-description">
              {metric.label}
            </Text>
          ) : null}
        </View>
        <View className={`min-w-0 flex-1 ${compact ? "mt-1" : "self-stretch"}`}>
          {!compact ? (
            <Text className="font-ralewaySemiBold text-xs leading-4 text-description">
              {metric.label}
            </Text>
          ) : null}
          {isLoading ? (
            <SkeletonBlock
              className={compact ? "mt-1 h-4 w-3/4" : "mt-3 h-4 w-3/4"}
            />
          ) : (
            <Text
              adjustsFontSizeToFit
              className={`font-ralewayBold text-textPrimary ${
                compact ? "text-xl leading-6" : "text-2xl leading-7"
              }`}
              numberOfLines={1}
            >
              {metric.value}
            </Text>
          )}
          <View className={compact ? "min-h-5" : "min-h-10 justify-start"}>
            {hasProgress ? (
              isLoading ? (
                <>
                  <SkeletonBlock className="mt-1.5 h-1.5 w-full" />
                  <SkeletonBlock className="h-2.5 w-8 self-end" />
                </>
              ) : (
                <>
                  <View
                    className={`${compact ? "mt-1" : "mt-2"} h-1.5 w-full overflow-hidden rounded-full bg-primary/10`}
                  >
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${boundedProgress}%` }}
                    />
                  </View>
                  <Text
                    className={`text-right font-ralewayMedium text-description ${
                      compact ? "text-[10px] leading-3" : "text-xs"
                    }`}
                  >
                    {metric.detail ?? `${Math.round(boundedProgress)}%`}
                  </Text>
                </>
              )
            ) : metric.detail ? (
              isLoading ? (
                <SkeletonBlock className="h-3 w-1/2" />
              ) : (
                <Text
                  className={`font-ralewayMedium text-description ${
                    compact ? "text-[10px] leading-3" : "text-xs"
                  }`}
                >
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

function MainMetric({
  icon,
  isLoading,
  label,
  split,
  supportingText,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isLoading: boolean;
  label: string;
  split: boolean;
  supportingText?: string;
  value: string;
}) {
  return (
    <View
      className={`overflow-hidden rounded-2xl border p-4 shadow-sm ${
        split
          ? "min-h-[248px] flex-1 items-start justify-between border-primary/25 bg-secondary shadow-secondary/25"
          : "min-h-32 flex-row items-center gap-4 border-textPrimary/10 bg-white shadow-textPrimary/10"
      }`}
    >
      {split ? (
        <>
          <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/10" />
          <View className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-primary/25" />
          <View className="h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-accent/15">
            <Ionicons name={icon} color={colors.accent} size={27} />
          </View>
        </>
      ) : (
        <MetricIcon icon={icon} large />
      )}

      <View className={split ? "w-full" : "min-w-0 flex-1"}>
        <Text
          className={
            split
              ? "font-ralewayExtraBold text-[11px] uppercase tracking-[1.2px] text-accent"
              : "font-ralewayMedium text-description"
          }
        >
          {label}
        </Text>
        {isLoading ? (
          <SkeletonBlock
            className={`mt-2 h-9 w-4/5 rounded-xl ${split ? "bg-white/25" : ""}`}
          />
        ) : (
          <Text
            adjustsFontSizeToFit
            className={`mt-1 leading-10 ${
              split
                ? "font-ralewayExtraBold text-[34px] text-white"
                : "font-ralewayBold text-3xl text-textPrimary"
            }`}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}

        {split && supportingText ? (
          <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2.5">
            <Ionicons
              name="information-circle-outline"
              color={colors.accent}
              size={15}
            />
            <Text className="min-w-0 flex-1 font-ralewaySemiBold text-[10px] leading-4 text-white/90">
              {supportingText}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function OverviewMetricCard({
  icon,
  isLoading,
  label,
  layout = "rows",
  metrics,
  supportingText,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  isLoading: boolean;
  label: string;
  layout?: "rows" | "split";
  metrics: OverviewSubMetric[];
  supportingText?: string;
  value: string;
}) {
  const split = layout === "split";

  return (
    <View className={split ? "flex-row gap-3" : "gap-3"}>
      <MainMetric
        icon={icon}
        isLoading={isLoading}
        label={label}
        split={split}
        supportingText={supportingText}
        value={value}
      />

      <View className={split ? "flex-1 gap-3" : "flex-row gap-3"}>
        {metrics.map((metric) => (
          <SubMetric
            compact={split}
            isLoading={isLoading}
            key={metric.label}
            metric={metric}
          />
        ))}
      </View>
    </View>
  );
}
