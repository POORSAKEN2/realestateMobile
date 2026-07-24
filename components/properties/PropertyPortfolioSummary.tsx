import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { formatPeso } from "../../utils/properties/propertyForm";

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-xs font-ralewaySemiBold text-white/70">{label}</Text>
      <Text
        className="mt-1 font-ralewayBold text-base text-white"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export function PropertyPortfolioSummary({
  averageRoi,
  portfolioValue,
  propertyCount,
  revenueGeneratingCount,
  state = "ready",
}: {
  averageRoi: number;
  portfolioValue: number;
  propertyCount: number;
  revenueGeneratingCount: number;
  state?: "error" | "loading" | "ready";
}) {
  const isReady = state === "ready";
  const portfolioValueLabel =
    state === "loading"
      ? "Loading…"
      : state === "error"
        ? "Unavailable"
        : formatPeso(portfolioValue);

  return (
    <View className="overflow-hidden rounded-3xl bg-[#1d1d1f] p-5 shadow-lg shadow-slate-900/15">
      <View className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/5" />

      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-ralewaySemiBold text-white/70">
            Total portfolio value
          </Text>
          <Text
            adjustsFontSizeToFit
            className="mt-1 font-ralewayBold text-3xl text-white"
            numberOfLines={1}
          >
            {portfolioValueLabel}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
          <MaterialCommunityIcons
            name="chart-box-outline"
            color="#93C5FD"
            size={21}
          />
        </View>
      </View>

      <View className="mt-5 flex-row gap-4 border-t border-white/10 pt-4">
        <SummaryMetric
          label="Properties"
          value={isReady ? String(propertyCount) : "—"}
        />
        <SummaryMetric
          label="Average ROI"
          value={isReady ? `${averageRoi.toFixed(1)}%` : "—"}
        />
        <SummaryMetric
          label="Generating"
          value={
            isReady ? `${revenueGeneratingCount} of ${propertyCount}` : "—"
          }
        />
      </View>
    </View>
  );
}
