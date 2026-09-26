import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { DeletionImpact } from "../../types";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { ModalHeader } from "../ui/ModalHeader";
import { appRoutes } from "../../constants/navigation";

const ACTION_LABELS = {
  archive: "Archive",
  restore: "Restore",
  cancel: "Cancel booking",
  delete: "Delete",
} as const;

const RESOURCE_ROUTES: Record<string, Href> = {
  properties: appRoutes.primary.properties,
  documents: appRoutes.secondary.documents,
  clients: appRoutes.primary.tenants,
  leases: appRoutes.secondary.leases,
  bookings: appRoutes.secondary.bookings,
  rooms: appRoutes.secondary.assignedRooms,
  floorplans: appRoutes.secondary.floorPlans,
  areas: appRoutes.secondary.floorAreas,
  bedspaces: appRoutes.secondary.bedspaces,
  payments: appRoutes.secondary.rent,
  expenses: appRoutes.primary.expenses,
};

function GroupList({ impact, onOpenResource }: { impact: DeletionImpact; onOpenResource: (resource: string) => void }) {
  const groups = [...impact.blockers.map((group) => ({ ...group, blocking: true })), ...impact.warnings.map((group) => ({ ...group, blocking: false }))];
  return (
    <View className="gap-3">
      {groups.map((group) => (
        <View className={`rounded-2xl p-4 ${group.blocking ? "bg-dangerSurface" : "bg-primary/10"}`} key={`${group.code}:${group.resource}`}>
          <Text className={`font-ralewayBold text-sm ${group.blocking ? "text-danger" : "text-textPrimary"}`}>
            {group.blocking ? "Blocking" : "Retained history"}: {group.code.replaceAll("_", " ")} ({group.count})
          </Text>
          {group.records.map((record) => {
            const linked = Boolean(RESOURCE_ROUTES[group.resource]);
            return (
              <TouchableOpacity
                className="mt-1 flex-row items-center gap-2 py-1"
                disabled={!linked}
                key={`${group.code}:${record.id}`}
                onPress={() => onOpenResource(group.resource)}
              >
                <Text className={`min-w-0 flex-1 text-xs ${linked ? "text-primary" : "text-description"}`}>
                  {record.label}{record.status ? ` · ${record.status}` : ""}
                </Text>
                {linked ? <MaterialCommunityIcons name="open-in-new" color="#8A77F4" size={14} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DeletionImpactSheet({
  error,
  impact,
  isLoading,
  isPending,
  label,
  onClose,
  onConfirm,
  onRetry,
  visible,
}: {
  error: unknown;
  impact: DeletionImpact | null;
  isLoading: boolean;
  isPending: boolean;
  label?: string;
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  visible: boolean;
}) {
  const router = useRouter();
  const title = impact ? `${ACTION_LABELS[impact.action]} record?` : "Check dependencies";
  const disabled = Boolean(error) || isLoading || !impact?.canExecute || impact.pagination.hasMore || isPending;
  return (
    <BottomSheetModal dismissDisabled={isPending} onClose={onClose} visible={visible}>
      <SafeAreaView className="max-h-[85%] rounded-t-[28px] bg-panel" edges={["bottom"]}>
        <ModalHeader onClose={onClose} subtitle={impact?.target.label ?? label} title={title} />
        <ScrollView contentContainerStyle={{ gap: 16, padding: 20 }}>
          {isLoading ? <ActivityIndicator color="#8A77F4" /> : null}
          {error && !impact ? (
            <View className="rounded-2xl bg-dangerSurface p-4">
              <Text className="text-sm text-danger">{error instanceof Error ? error.message : "Dependency check failed."}</Text>
              <TouchableOpacity className="mt-3" onPress={onRetry}><Text className="font-ralewayBold text-primary">Try again</Text></TouchableOpacity>
            </View>
          ) : null}
          {impact ? (
            <>
              <View className="rounded-2xl bg-surface p-4">
                <Text className="font-ralewayBold text-sm text-textPrimary">{impact.target.label}</Text>
                <Text className="mt-1 text-xs text-description">
                  {impact.target.resource} · {impact.target.id}
                  {impact.target.status ? ` · ${impact.target.status}` : ""}
                </Text>
              </View>
              <Text className="text-sm leading-6 text-description">
                {impact.blockers.length ? "Resolve blockers before continuing." : "Server found no blocking dependencies."}
              </Text>
              <GroupList
                impact={impact}
                onOpenResource={(resource) => {
                  const route = RESOURCE_ROUTES[resource];
                  if (!route) return;
                  onClose();
                  router.push(route);
                }}
              />
              {impact.pagination.hasMore ? <Text className="text-xs text-danger">More dependency records remain. Action disabled.</Text> : null}
            </>
          ) : null}
        </ScrollView>
        <View className="flex-row gap-3 border-t border-black/5 p-5">
          <TouchableOpacity className="min-h-14 flex-1 items-center justify-center rounded-2xl border border-primary" disabled={isPending} onPress={onClose}>
            <Text className="font-ralewayBold text-primary">Close</Text>
          </TouchableOpacity>
          <TouchableOpacity className={`min-h-14 flex-1 items-center justify-center rounded-2xl ${disabled ? "bg-gray-300" : "bg-danger"}`} disabled={disabled} onPress={onConfirm}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text className="font-ralewayBold text-white">{impact ? ACTION_LABELS[impact.action] : "Continue"}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BottomSheetModal>
  );
}
