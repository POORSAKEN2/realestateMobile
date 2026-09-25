export type DeletionStatus =
  | "pending"
  | "information_required"
  | "approved"
  | "scheduled"
  | "processing"
  | "completed"
  | "failed"
  | "rejected"
  | "cancelled";

export type DeletionScope = "user" | "tenant";
export type DeletionAction =
  | "approve"
  | "reject"
  | "request_information"
  | "respond"
  | "cancel"
  | "retry"
  | "submit";

export type DeletionHistoryItem = {
  status: DeletionStatus;
  label: string;
  at: string;
};

export type DeletionImpactGroup = {
  code: string;
  label: string;
  count: number;
  retention_action: "delete" | "anonymize" | "retain_anonymized";
};

export type AccountDeletionImpact = {
  scope: DeletionScope;
  summary: string;
  groups: DeletionImpactGroup[];
  total_records: number;
};

export type AccountDeletionRequest = {
  id: string;
  scope: DeletionScope;
  status: DeletionStatus;
  requester: { id: string; name: string; email: string; role: string } | null;
  reason: string | null;
  identity_verified_at: string | null;
  requested_at: string | null;
  reviewed_at: string | null;
  reviewer: { id: string; name: string; role: string } | null;
  decision_reason: string | null;
  information_requested: string | null;
  requester_response: string | null;
  approved_at: string | null;
  scheduled_for: string | null;
  processing_started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  impact: AccountDeletionImpact | null;
  completion_counts: Record<string, number> | null;
  subscription_blocker: Record<string, unknown> | null;
  available_actions: DeletionAction[];
  history: DeletionHistoryItem[];
};

export type SubscriptionCancellationRequiredError = {
  success: false;
  error: "subscription_cancellation_required";
  message: string;
  errors: { subscription: Record<string, unknown> };
};

export type AccountDeletionPage = {
  current_page: number;
  data: AccountDeletionRequest[];
  last_page: number;
  total: number;
};
