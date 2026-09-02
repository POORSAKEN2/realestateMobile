import { formatPeso } from "../../utils/properties/propertyForm";
import { DashboardSummaryCard } from "../dashboard/DashboardSummaryCard";

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
    <DashboardSummaryCard
      badge="Admin overview"
      icon="chart-box-outline"
      label="Total portfolio value"
      metrics={[
        {
          icon: "office-building-outline",
          label: "Properties",
          value: isReady ? String(propertyCount) : "—",
        },
        {
          icon: "chart-line-variant",
          label: "Average ROI",
          value: isReady ? `${averageRoi.toFixed(1)}%` : "—",
        },
        {
          icon: "chart-donut",
          label: "Generating",
          value: isReady
            ? `${revenueGeneratingCount} of ${propertyCount}`
            : "—",
        },
      ]}
      state={state}
      value={portfolioValueLabel}
      variant="admin"
    />
  );
}
