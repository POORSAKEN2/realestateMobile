import type { BillingEntitlement, PlanChangeBlocker } from "../../types/domain/billing";

export const dimensionLabels: Record<string, string> = {
  properties: "Properties", published_listings: "Published listings", storage_bytes: "Storage",
  users: "Users", analytics_depth: "Analytics", reports_level: "Reports", support_level: "Support", retention_days: "History",
};
export function formatUsage(dimension: string, amount: number): string {
  if (dimension !== "storage_bytes") return amount.toLocaleString();
  if (amount === 0) return "0 B";
  const unit = Math.min(3, Math.max(0, Math.floor(Math.log(amount) / Math.log(1024))));
  return `${Number((amount / 1024 ** unit).toFixed(2))} ${["B", "KB", "MB", "GB"][unit]}`;
}
export function blockerMessage(blocker: PlanChangeBlocker) {
  return `${dimensionLabels[blocker.dimension] ?? blocker.dimension}: using ${formatUsage(blocker.dimension, blocker.current)}, target allows ${formatUsage(blocker.dimension, blocker.target_limit)}. Reduce by ${formatUsage(blocker.dimension, blocker.excess)}.`;
}
export function billingStatusMessage(entitlement: BillingEntitlement) {
  const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleDateString() : null;
  if (entitlement.in_grace_period) return `Payment needs attention. Paid access continues${date(entitlement.grace_ends_at) ? ` until ${date(entitlement.grace_ends_at)}` : " during your grace period"}.`;
  if (entitlement.status === "canceled") return entitlement.effective_tier !== "free"
    ? `Renewal canceled. Paid access continues${date(entitlement.current_period_end) ? ` until ${date(entitlement.current_period_end)}` : " through your paid period"}.`
    : "Subscription canceled. Free plan limits now apply.";
  if (["expired", "paused", "past_due"].includes(entitlement.status ?? "")) return "Subscription is inactive. Your effective plan determines current access.";
  if (entitlement.status === "trialing") return "Trial subscription";
  return entitlement.status === "active" ? "Active subscription" : "Current plan";
}
