import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { formatPeso } from "../../utils/properties/propertyForm";

const portfolioSummaryShadow = {
  elevation: 10,
  shadowColor: colors.secondary,
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.24,
  shadowRadius: 16,
};

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="font-ralewaySemiBold text-xs text-white/70">
        {label}
      </Text>
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
    <View
      className="rounded-3xl bg-secondary shadow-2xl shadow-secondary/30"
      style={portfolioSummaryShadow}
    >
      <View className="overflow-hidden rounded-3xl bg-secondary p-5">
        <View className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/40" />

        <View className="flex-row items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="font-ralewaySemiBold text-xs text-white/70">
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
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
            <MaterialCommunityIcons
              name="chart-box-outline"
              color="#FFFFFF"
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
    </View>
  );
}
