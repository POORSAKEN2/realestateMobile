export type AuditFilters = {
  search?: string;
  actor_id?: string;
  action?: string;
  entity?: string;
  property_id?: string;
  result?: string;
  start_date?: string;
  end_date?: string;
};

export type AuditEvent = {
  id: string;
  tenant_id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  request_id: string;
  result: string;
  origin: string;
  created_at: string;
  before_values: Record<string, unknown>;
  after_values: Record<string, unknown>;
  property_ids: string[];
  metadata: {
    route?: string;
    method?: string;
    status_code?: number;
    policy?: string;
  };
  record_path?: string | null;
};

export type AuditPage = {
  events: AuditEvent[];
  next_cursor: string | null;
  meta: {
    effective_start: string | null;
    effective_end: string;
    retention_days: number | null;
    capture_started_at: string;
    entities?: string[];
  };
};

export type AuditRecord = {
  entity: string;
  entity_id: string;
  values: Record<string, unknown>;
};
