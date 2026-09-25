import type {
  AccountDeletionImpact,
  AccountDeletionPage,
  AccountDeletionRequest,
  DeletionAction,
  DeletionHistoryItem,
  DeletionScope,
  DeletionStatus,
} from "../../types";

const statuses = new Set<DeletionStatus>([
  "pending",
  "information_required",
  "approved",
  "scheduled",
  "processing",
  "completed",
  "failed",
  "rejected",
  "cancelled",
]);
const scopes = new Set<DeletionScope>(["user", "tenant"]);
const actions = new Set<DeletionAction>([
  "approve",
  "reject",
  "request_information",
  "respond",
  "cancel",
  "retry",
  "submit",
]);
const retentionActions = new Set([
  "delete",
  "anonymize",
  "retain_anonymized",
] as const);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length ? value : null;
}

function normalizeImpact(value: unknown): AccountDeletionImpact | null {
  const source = record(value);
  if (
    !scopes.has(source.scope as DeletionScope) ||
    !Array.isArray(source.groups)
  )
    return null;
  const groups = source.groups.flatMap((item) => {
    const group = record(item);
    if (
      typeof group.code !== "string" ||
      typeof group.label !== "string" ||
      typeof group.count !== "number" ||
      !retentionActions.has(group.retention_action as never)
    )
      return [];
    return [
      {
        code: group.code,
        label: group.label,
        count: group.count,
        retention_action:
          group.retention_action as AccountDeletionImpact["groups"][number]["retention_action"],
      },
    ];
  });
  return {
    scope: source.scope as DeletionScope,
    summary: typeof source.summary === "string" ? source.summary : "",
    groups,
    total_records:
      typeof source.total_records === "number"
        ? source.total_records
        : groups.reduce((total, group) => total + group.count, 0),
  };
}

function normalizeHistory(value: unknown): DeletionHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const event = record(item);
    if (
      !statuses.has(event.status as DeletionStatus) ||
      typeof event.label !== "string" ||
      typeof event.at !== "string"
    )
      return [];
    return [
      {
        status: event.status as DeletionStatus,
        label: event.label,
        at: event.at,
      },
    ];
  });
}

export function normalizeAccountDeletion(
  value: unknown,
): AccountDeletionRequest {
  const source = record(value);
  if (
    typeof source.id !== "string" ||
    !statuses.has(source.status as DeletionStatus) ||
    !scopes.has(source.scope as DeletionScope)
  ) {
    throw new Error("Deletion request response is invalid.");
  }
  const requester = record(source.requester);
  const reviewer = record(source.reviewer);
  const counts = record(source.completion_counts);
  const blocker = record(source.subscription_blocker);

  return {
    id: source.id,
    status: source.status as DeletionStatus,
    scope: source.scope as DeletionScope,
    requester:
      typeof requester.id === "string"
        ? {
            id: requester.id,
            name: String(requester.name ?? ""),
            email: String(requester.email ?? ""),
            role: String(requester.role ?? ""),
          }
        : null,
    reason: nullableString(source.reason),
    identity_verified_at: nullableString(source.identity_verified_at),
    requested_at: nullableString(source.requested_at),
    reviewed_at: nullableString(source.reviewed_at),
    reviewer:
      typeof reviewer.id === "string"
        ? {
            id: reviewer.id,
            name: String(reviewer.name ?? ""),
            role: String(reviewer.role ?? ""),
          }
        : null,
    decision_reason: nullableString(source.decision_reason),
    information_requested: nullableString(source.information_requested),
    requester_response: nullableString(source.requester_response),
    approved_at: nullableString(source.approved_at),
    scheduled_for: nullableString(source.scheduled_for),
    processing_started_at: nullableString(source.processing_started_at),
    completed_at: nullableString(source.completed_at),
    failed_at: nullableString(source.failed_at),
    failure_reason: nullableString(source.failure_reason),
    retry_count:
      typeof source.retry_count === "number" ? source.retry_count : 0,
    impact: normalizeImpact(source.impact),
    completion_counts: Object.keys(counts).length
      ? Object.fromEntries(
          Object.entries(counts).filter(
            (entry): entry is [string, number] => typeof entry[1] === "number",
          ),
        )
      : null,
    subscription_blocker: Object.keys(blocker).length ? blocker : null,
    available_actions: Array.isArray(source.available_actions)
      ? source.available_actions.filter((action): action is DeletionAction =>
          actions.has(action as DeletionAction),
        )
      : [],
    history: normalizeHistory(source.history),
  };
}

export function normalizeAccountDeletionPage(
  value: unknown,
): AccountDeletionPage {
  const source = record(value);
  return {
    current_page:
      typeof source.current_page === "number" ? source.current_page : 1,
    data: Array.isArray(source.data)
      ? source.data.map(normalizeAccountDeletion)
      : [],
    last_page: typeof source.last_page === "number" ? source.last_page : 1,
    total: typeof source.total === "number" ? source.total : 0,
  };
}

export function deletionStatusLabel(status: DeletionStatus): string {
  return status
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function restorationNotice(scope: DeletionScope): string {
  return scope === "tenant"
    ? "Your organization and its data were restored before the deletion deadline. Store subscription cancellation is unchanged."
    : "Your account deletion was cancelled and access was restored.";
}

export function subscriptionCancellationMessage(error: {
  code?: string;
  message?: string;
}): string | null {
  return error.code === "subscription_cancellation_required"
    ? (error.message ??
        "Cancel store auto-renewal before scheduling account closure.")
    : null;
}
