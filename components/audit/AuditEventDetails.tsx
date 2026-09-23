import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/colors";
import type { AuditEvent } from "../../types/domain/audit";
import { auditLabel } from "../../utils/audit/presentation";
import { AuditResultBadge } from "./AuditResultBadge";
import { AuditValues } from "./AuditValues";

export function AuditEventDetails({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const actor =
    event.actor_role === "ADMIN"
      ? "Administrator"
      : event.actor_role
        ? auditLabel(event.actor_role)
        : event.actor_id || event.origin === "http"
          ? "Unknown actor"
          : "System";
  return (
    <View className="gap-5">
      <View className="gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <View className="flex-row flex-wrap items-start gap-3">
          <Text
            accessibilityRole="header"
            className="min-w-0 flex-1 font-ralewayExtraBold text-lg text-textPrimary"
          >
            {auditLabel(event.action)}
          </Text>
          <AuditResultBadge result={event.result} />
        </View>
        <AuditValues
          compact
          title="Summary"
          values={{
            entity: auditLabel(event.entity),
            performed_by: actor,
            source:
              event.origin === "http"
                ? "App / API request"
                : auditLabel(event.origin),
          }}
        />
      </View>
      <AuditValues title="Before change" values={event.before_values} />
      <AuditValues title="After change" values={event.after_values} />
      <View className="gap-3 rounded-2xl border border-textPrimary/10 p-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Hide technical details" : "Show technical details"
          }
          accessibilityState={{ expanded }}
          className="min-h-12 flex-row items-center gap-3"
          onPress={() => setExpanded((value) => !value)}
        >
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Technical details
            </Text>
            <Text className="text-xs leading-5 text-description">
              Exact action, IDs, property scope, and request data.
            </Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
        {expanded ? (
          <>
            <AuditValues
              title="Identifiers & scope"
              values={{
                event_id: event.id,
                action: event.action,
                result: event.result,
                entity: event.entity,
                record_id: event.entity_id,
                actor_id: event.actor_id,
                actor_role: event.actor_role,
                correlation_id: event.request_id,
                origin: event.origin,
                property_ids: event.property_ids,
              }}
            />
            {Object.keys(event.metadata).length ? (
              <AuditValues title="Request metadata" values={event.metadata} />
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}
