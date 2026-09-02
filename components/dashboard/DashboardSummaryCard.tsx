import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { SkeletonBlock } from "../ui/Skeleton";

type DashboardSummaryMetric = {
  label: string;
  value: string;
};

const summaryShadow = {
  elevation: 10,
  shadowColor: colors.secondary,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.24,
  shadowRadius: 16,
};

function SummaryMetric({
  isLoading,
  metric,
}: {
  isLoading: boolean;
  metric: DashboardSummaryMetric;
}) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="font-ralewaySemiBold text-xs text-accent/80">
        {metric.label}
      </Text>
      {isLoading ? (
        <SkeletonBlock className="mt-2 h-4 w-2/3 bg-accent/20" />
      ) : (
        <Text
          className="mt-1 font-ralewayBold text-base text-white"
          numberOfLines={1}
        >
          {metric.value}
        </Text>
      )}
    </View>
  );
}

export function DashboardSummaryCard({
  icon,
  label,
  metrics,
  state = "ready",
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  metrics: DashboardSummaryMetric[];
  state?: "error" | "loading" | "ready";
  value: string;
}) {
  const isLoading = state === "loading";

  return (
    <View
      className="rounded-3xl border border-primary/25 bg-secondary shadow-2xl shadow-secondary/30"
      style={summaryShadow}
    >
      <View className="overflow-hidden rounded-3xl bg-secondary p-5">
        <View className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/60" />
        <View className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-accent/10" />

        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="font-ralewaySemiBold text-xs text-accent/80">
              {label}
            </Text>
            {isLoading ? (
              <SkeletonBlock className="mt-2 h-9 w-4/5 rounded-xl bg-accent/20" />
            ) : (
              <Text
                adjustsFontSizeToFit
                className="mt-1 font-ralewayBold text-3xl text-white"
                numberOfLines={1}
              >
                {value}
              </Text>
            )}
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-2xl border border-accent/25 bg-accent/15">
            <MaterialCommunityIcons
              name={icon}
              color={colors.accent}
              size={21}
            />
          </View>
        </View>

        <View className="mt-5 flex-row gap-4 border-t border-accent/50 pt-4">
          {metrics.map((metric) => (
            <SummaryMetric
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
