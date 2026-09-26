import type {
  BillingEntitlement,
  PlanChangeBlocker,
  UsageLimit,
} from "../../types/domain/billing";
import { formatNumber } from "../formatters";

export function usagePercentage(usage: UsageLimit): number {
  if (usage.limit === null) return 0;
  if (usage.limit <= 0) return usage.used > 0 ? 100 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round((usage.used / usage.limit) * 100)),
  );
}

export const dimensionLabels: Record<string, string> = {
  properties: "Properties",
  published_listings: "Published listings",
  storage_bytes: "Storage",
  users: "Users",
  analytics_depth: "Analytics",
  reports_level: "Reports",
  support_level: "Support",
  retention_days: "History",
};
export function formatUsage(dimension: string, amount: number): string {
  if (dimension !== "storage_bytes") return formatNumber(amount, 0);
  if (amount === 0) return "0 B";
  const unit = Math.min(
    3,
    Math.max(0, Math.floor(Math.log(amount) / Math.log(1024))),
  );
  return `${Number((amount / 1024 ** unit).toFixed(2))} ${["B", "KB", "MB", "GB"][unit]}`;
}
export function blockerMessage(blocker: PlanChangeBlocker) {
  return `${dimensionLabels[blocker.dimension] ?? blocker.dimension}: using ${formatUsage(blocker.dimension, blocker.current)}, target allows ${formatUsage(blocker.dimension, blocker.target_limit)}. Reduce by ${formatUsage(blocker.dimension, blocker.excess)}.`;
}
export function billingStatusMessage(entitlement: BillingEntitlement) {
  const date = (value?: string | null) =>
    value && Number.isFinite(Date.parse(value))
      ? new Date(value).toLocaleDateString()
      : null;
  if (entitlement.access_mode === "read_only")
    return "Subscription inactive. Existing data remains available; subscribe to resume changes.";
  if (entitlement.entitlement_source === "trial")
    return `Professional trial${date(entitlement.trial_ends_at) ? ` ends on ${date(entitlement.trial_ends_at)}` : " active"}.`;
  if (entitlement.in_grace_period)
    return `Payment needs attention. Paid access continues${date(entitlement.grace_ends_at) ? ` until ${date(entitlement.grace_ends_at)}` : " during your grace period"}.`;
  if (entitlement.status === "canceled")
    return entitlement.effective_tier !== "free"
      ? `Renewal canceled. Paid access continues${date(entitlement.current_period_end) ? ` until ${date(entitlement.current_period_end)}` : " through your paid period"}.`
      : "Subscription canceled. Subscribe to resume changes.";
  if (["expired", "paused", "past_due"].includes(entitlement.status ?? ""))
    return "Subscription is inactive. Your effective plan determines current access.";
  if (entitlement.entitlement_source === "legacy")
    return "Grandfathered plan access. Existing purchase rights are preserved.";
  if (entitlement.status === "trialing") return "Trial subscription";
  return entitlement.status === "active"
    ? "Active subscription"
    : "Current plan";
}
