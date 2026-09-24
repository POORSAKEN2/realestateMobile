export type GovernedResource =
  | "properties"
  | "documents"
  | "clients"
  | "leases"
  | "bookings"
  | "rooms"
  | "floorplans"
  | "areas"
  | "bedspaces"
  | "payments"
  | "expenses";

export type GovernedAction = "archive" | "restore" | "cancel" | "delete";

export type DeletionImpactRecord = {
  id: string;
  label: string;
  status: string | null;
};

export type DeletionImpactGroup = {
  code: string;
  resource: string;
  count: number;
  records: DeletionImpactRecord[];
};

export type DeletionImpact = {
  target: {
    resource: GovernedResource;
    id: string;
    label: string;
    status: string | null;
    archivedAt: string | null;
  };
  action: GovernedAction;
  canExecute: boolean;
  blockers: DeletionImpactGroup[];
  warnings: DeletionImpactGroup[];
  inspectedAt: string;
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
    nextPage: number | null;
  };
};
