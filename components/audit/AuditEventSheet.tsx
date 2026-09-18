import type { UseQueryResult } from "@tanstack/react-query";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import type { AuditEvent, AuditRecord } from "../../types/domain/audit";
import { SearchFilterSheet } from "../ui/SearchFilterSheet";
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
      description={
        event ? new Date(event.created_at).toLocaleString() : "Event details"
      }
      visible={visible}
      onClose={onClose}
    >
      {detail.isPending ? (
        <ActivityIndicator />
      ) : detail.error ? (
        <View className="gap-3">
          <Text accessibilityRole="alert">{detail.error.message}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => detail.refetch()}
          >
            <Text className="text-primary">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : event ? (
        <>
          <AuditValues
            title="Event"
            values={{
              action: event.action,
              result: event.result,
              entity: event.entity,
              record_id: event.entity_id,
              actor_id: event.actor_id,
              actor_role: event.actor_role,
              correlation_id: event.request_id,
              origin: event.origin,
              property_ids: event.property_ids,
              ...event.metadata,
            }}
          />
          <AuditValues title="Before" values={event.before_values} />
          <AuditValues title="After" values={event.after_values} />
          {event.record_path ? (
            <TouchableOpacity
              accessibilityRole="button"
              className="rounded-xl bg-primary/10 px-4 py-3"
              onPress={onShowRecord}
            >
              <Text className="text-primary">View current record</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-description">
              Record deleted or access unavailable.
            </Text>
          )}
          {showRecord && record.isPending ? <ActivityIndicator /> : null}
          {showRecord && record.error ? (
            <View className="gap-2">
              <Text accessibilityRole="alert">{record.error.message}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => record.refetch()}
              >
                <Text className="text-primary">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {showRecord && record.data && !record.error ? (
            <AuditValues
              title={`Current ${record.data.entity}`}
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
