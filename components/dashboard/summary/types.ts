import { MaterialCommunityIcons } from "@expo/vector-icons";

export type DashboardSummaryMetricTone = "neutral" | "success" | "warning";

export type DashboardSummaryMetric = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  tone?: DashboardSummaryMetricTone;
  value: string;
};

export type DashboardSummaryCardProps = {
  badge: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label?: string;
  metrics: DashboardSummaryMetric[];
  state?: "error" | "loading" | "ready";
  subtitle?: string;
  value: string;
  variant: "admin" | "manager";
};

export type RoleDashboardSummaryCardProps = Omit<
  DashboardSummaryCardProps,
  "variant"
> & {
  isLoading: boolean;
};
