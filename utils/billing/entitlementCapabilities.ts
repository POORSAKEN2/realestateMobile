import type { BillingEntitlement } from "../../types/domain/billing";

export type SizedUpload = { size?: number | null };

const ANALYTICS_DEPTH_ORDER = ["current_period", "historical", "full"] as const;

export function hasAnalyticsDepth(
  entitlement: BillingEntitlement | undefined,
  required: "current_period" | "historical" | "full",
) {
  const current = entitlement?.limits?.analytics_depth?.level;
  return (
    current !== undefined &&
    ANALYTICS_DEPTH_ORDER.indexOf(current as (typeof ANALYTICS_DEPTH_ORDER)[number]) >=
      ANALYTICS_DEPTH_ORDER.indexOf(required)
  );
}

export function totalKnownUploadBytes(files: readonly SizedUpload[]) {
  return files.reduce(
    (total, file) =>
      total +
      (typeof file.size === "number" && Number.isFinite(file.size)
        ? Math.max(0, file.size)
        : 0),
    0,
  );
}

export function remainingStorageBytes(
  entitlement: BillingEntitlement | undefined,
) {
  const storage = entitlement?.limits?.storage_bytes;
  if (!storage || storage.unlimited || storage.limit === null) return null;
  return Math.max(0, storage.limit - storage.used);
}

export function storageUploadError(
  entitlement: BillingEntitlement | undefined,
  files: readonly SizedUpload[],
) {
  if (!entitlement || entitlement.gating_enabled === false) return null;
  const remaining = remainingStorageBytes(entitlement);
  const requested = totalKnownUploadBytes(files);
  if (remaining === null || requested <= remaining) return null;

  return `These files need ${formatBytes(requested)}, but your plan has ${formatBytes(remaining)} left. Remove files or upgrade your plan.`;
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${trimDecimal(bytes / 1024 ** 3)} GB`;
  if (bytes >= 1024 ** 2) return `${trimDecimal(bytes / 1024 ** 2)} MB`;
  if (bytes >= 1024) return `${trimDecimal(bytes / 1024)} KB`;
  return `${Math.max(0, Math.round(bytes))} B`;
}

export function retentionDescription(
  entitlement: BillingEntitlement | undefined,
) {
  const days = entitlement?.limits?.retention_days?.days;
  if (days === null) return "Plan allows unlimited history retention";
  if (typeof days !== "number") return "History availability follows your plan";
  if (days % 365 === 0) {
    const years = days / 365;
    return `History retained for ${years} ${years === 1 ? "year" : "years"}`;
  }
  return `History retained for ${days} days`;
}

export function supportLevelLabel(level?: string) {
  if (level === "named_escalation") return "Named escalation support";
  if (level === "priority") return "Priority support";
  if (level === "community") return "Community support";
  return "Standard support";
}

function trimDecimal(value: number) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}
