import { ApiError } from "../../api/errors";
import type {
  DeletionImpact,
  DeletionImpactGroup,
  GovernedAction,
  GovernedResource,
} from "../../types";

function normalizeGroup(value: any): DeletionImpactGroup {
  return {
    code: String(value?.code ?? "dependency"),
    resource: String(value?.resource ?? "unknown"),
    count: Number(value?.count ?? 0),
    records: Array.isArray(value?.records)
      ? value.records.map((record: any) => ({
          id: String(record?.id ?? ""),
          label: String(record?.label ?? "Record"),
          status: record?.status == null ? null : String(record.status),
        }))
      : [],
  };
}

export function normalizeDeletionImpact(value: any): DeletionImpact {
  return {
    target: {
      resource: String(value?.target?.resource ?? "properties") as GovernedResource,
      id: String(value?.target?.id ?? ""),
      label: String(value?.target?.label ?? "Record"),
      status: value?.target?.status == null ? null : String(value.target.status),
      archivedAt: value?.target?.archived_at ?? value?.target?.archivedAt ?? null,
    },
    action: String(value?.action ?? "delete") as GovernedAction,
    canExecute: Boolean(value?.can_execute ?? value?.canExecute),
    blockers: Array.isArray(value?.blockers) ? value.blockers.map(normalizeGroup) : [],
    warnings: Array.isArray(value?.warnings) ? value.warnings.map(normalizeGroup) : [],
    inspectedAt: String(value?.inspected_at ?? value?.inspectedAt ?? ""),
    pagination: {
      page: Number(value?.pagination?.page ?? 1),
      perPage: Number(value?.pagination?.per_page ?? value?.pagination?.perPage ?? 50),
      hasMore: Boolean(value?.pagination?.has_more ?? value?.pagination?.hasMore),
      nextPage: value?.pagination?.next_page ?? value?.pagination?.nextPage ?? null,
    },
  };
}

export function deletionImpactFromError(error: unknown): DeletionImpact | null {
  if (!(error instanceof ApiError) || error.status !== 409 || error.code !== "deletion_blocked") return null;
  const impact = error.details?.impact;
  return impact && typeof impact === "object" ? normalizeDeletionImpact(impact) : null;
}
