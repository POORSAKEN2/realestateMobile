import { memo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { AuditResultBadge } from "./AuditResultBadge";
import type { AuditEvent } from "../../types/domain/audit";
import { auditDate, auditLabel } from "../../utils/audit/presentation";

export const AuditEventCard = memo(function AuditEventCard({
  event,
  onOpen,
}: {
  event: AuditEvent;
  onOpen: (id: string) => void;
}) {
  const actor = event.actor_role
    ? auditLabel(event.actor_role)
    : event.origin === "http"
      ? "Unknown actor"
      : "System";
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${auditLabel(event.action)}. ${auditLabel(event.result)}. ${auditDate(event.created_at, true)}`}
      activeOpacity={0.8}
      className="gap-3 rounded-2xl border border-textPrimary/10 bg-panel p-4"
      onPress={() => onOpen(event.id)}
    >
      <View className="flex-row items-start gap-3">
        <Text className="min-w-0 flex-1 font-ralewayExtraBold text-base text-textPrimary">
          {auditLabel(event.action)}
        </Text>
        <AuditResultBadge result={event.result} />
      </View>
      <Text className="text-xs text-description" selectable>
        {event.action} · {event.entity}
      </Text>
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="font-ralewaySemiBold text-sm text-description">
            {actor}
            {event.actor_id ? ` · ${event.actor_id.slice(0, 8)}` : ""}
          </Text>
          <Text className="text-xs text-description">
            {auditDate(event.created_at, true)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" color="#6F6D6D" size={18} />
      </View>
    </TouchableOpacity>
  );
});
