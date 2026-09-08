import { AdminDashboardSummaryCard } from "./summary/AdminDashboardSummaryCard";
import { ManagerDashboardSummaryCard } from "./summary/ManagerDashboardSummaryCard";
import type { DashboardSummaryCardProps } from "./summary/types";

export type {
  DashboardSummaryCardProps,
  DashboardSummaryMetric,
} from "./summary/types";

export function DashboardSummaryCard(props: DashboardSummaryCardProps) {
  const isLoading = props.state === "loading";

  return props.variant === "admin" ? (
    <AdminDashboardSummaryCard {...props} isLoading={isLoading} />
  ) : (
    <ManagerDashboardSummaryCard {...props} isLoading={isLoading} />
  );
}
