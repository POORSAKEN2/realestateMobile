import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchAuditEvent,
  fetchAuditHistory,
  fetchAuditRecord,
} from "../../api/audit";
import type { AuditFilters } from "../../types/domain/audit";
import { useAuth } from "../useAuth";
import { useAccess } from "../auth/useAccess";

export function useAuditHistory(
  filters: AuditFilters,
  eventId: string | null,
  showRecord: boolean,
) {
  const { session } = useAuth();
  const { can } = useAccess();
  const user = session?.user as { id?: string; tenant_id?: string } | undefined;
  const identity = [user?.id, user?.tenant_id];
  const enabled = can("audit.view");
  const history = useInfiniteQuery({
    queryKey: ["audit-history", ...identity, filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      fetchAuditHistory(filters, pageParam, signal),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    enabled,
    staleTime: 0,
  });
  const detail = useQuery({
    queryKey: ["audit-event", ...identity, eventId],
    queryFn: ({ signal }) => fetchAuditEvent(eventId!, signal),
    enabled: enabled && Boolean(eventId),
    staleTime: 0,
  });
  const record = useQuery({
    queryKey: ["audit-record", ...identity, eventId],
    queryFn: ({ signal }) => fetchAuditRecord(eventId!, signal),
    enabled:
      enabled &&
      Boolean(eventId) &&
      showRecord &&
      Boolean(detail.data?.record_path),
    staleTime: 0,
  });
  return { history, detail, record };
}
