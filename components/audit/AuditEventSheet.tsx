import type { UseQueryResult } from "@tanstack/react-query";
import { ActivityIndicator, Text } from "react-native";
import type { AuditEvent, AuditRecord } from "../../types/domain/audit";
import { SearchFilterSheet } from "../ui/SearchFilterSheet";
import { AuditErrorState } from "./AuditErrorState";
import { Button } from "../ui/buttons/Button";
import { auditDate, auditLabel } from "../../utils/audit/presentation";
import { AuditEventDetails } from "./AuditEventDetails";
import { AuditValues } from "./AuditValues";

export function AuditEventSheet({
  visible,
  detail,
  record,
  showRecord,
  onShowRecord,
  onClose,
}: {
  visible: boolean;
  detail: UseQueryResult<AuditEvent, Error>;
  record: UseQueryResult<AuditRecord, Error>;
  showRecord: boolean;
  onShowRecord: () => void;
  onClose: () => void;
}) {
  const event = detail.data;
  return (
    <SearchFilterSheet
      title="Audit event"
      description={event ? auditDate(event.created_at, true) : "Event details"}
      visible={visible}
      onClose={onClose}
    >
      {detail.isPending ? (
        <ActivityIndicator />
      ) : detail.error ? (
        <AuditErrorState
          error={detail.error}
          retrying={detail.isFetching}
          onRetry={() => {
            void detail.refetch();
          }}
        />
      ) : event ? (
        <>
          <AuditEventDetails key={event.id} event={event} />
          {event.record_path ? (
            <Button
              title={
                showRecord ? "Refresh current record" : "View current record"
              }
              variant="secondary"
              isLoading={showRecord && record.isFetching}
              onPress={() => {
                if (showRecord) void record.refetch();
                else onShowRecord();
              }}
            />
          ) : (
            <Text className="text-description">
              Record deleted or access unavailable.
            </Text>
          )}
          {showRecord ? (
            <Text className="text-xs leading-5 text-description">
              The current record shows its latest state. Before and after values
              describe this event.
            </Text>
          ) : null}
          {showRecord && record.isPending ? <ActivityIndicator /> : null}
          {showRecord && record.error ? (
            <AuditErrorState
              error={record.error}
              retrying={record.isFetching}
              onRetry={() => {
                void record.refetch();
              }}
            />
          ) : null}
          {showRecord && record.data && !record.error ? (
            <AuditValues
              title={`Current ${auditLabel(record.data.entity)}`}
              values={{
                record_id: record.data.entity_id,
                ...record.data.values,
              }}
            />
          ) : null}
        </>
      ) : null}
    </SearchFilterSheet>
  );
}
