import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { shareAuditHistory } from "../../api/audit";
import { AuditEventSheet } from "../../components/audit/AuditEventSheet";
import { AuditFilterSheet } from "../../components/audit/AuditFilterSheet";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { useAuditHistory } from "../../hooks/api/useAuditHistory";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import type { AuditFilters } from "../../types/domain/audit";

const buttonStyle = "rounded-xl bg-primary/10 px-4 py-3";
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Audit history could not be loaded.";

export default function AuditHistoryScreen() {
  const { can } = useAccess();
  const { session } = useAuth();
  const user = session?.user as { id?: string } | undefined;
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const linkedId = Array.isArray(params.eventId)
    ? params.eventId[0]
    : params.eventId;
  const [filters, setFilters] = useState<AuditFilters>({});
  const [draft, setDraft] = useState<AuditFilters>({});
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [eventId, setEventId] = useState<string | null>(linkedId ?? null);
  const [showRecord, setShowRecord] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const audit = useAuditHistory(filters, eventId, showRecord);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((current) => ({
          ...current,
          search: search.trim() || undefined,
        })),
      350,
    );
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setFilters({});
    setDraft({});
    setSearch("");
    setShowRecord(false);
    setFilterOpen(false);
    setNotice("");
    setEventId(linkedId ?? null);
  }, [user?.id, linkedId]);
  const meta = audit.history.data?.pages[0]?.meta;
  const events = audit.history.data?.pages.flatMap((page) => page.events) ?? [];

  async function exportHistory() {
    setExporting(true);
    setNotice("");
    try {
      await shareAuditHistory(filters);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  if (!can("audit.view"))
    return (
      <Screen>
        <SecondaryBackButton />
        <ModuleEmptyState
          icon="lock-closed-outline"
          title="Access unavailable"
          description="Audit History is available to account administrators."
        />
      </Screen>
    );

  return (
    <Screen className="bg-surface">
      <SecondaryBackButton />
      <ModuleHeader
        title="Audit History"
        supportingText="Investigate account changes and security events."
      />
      <TextInput
        accessibilityLabel="Search audit history"
        value={search}
        onChangeText={setSearch}
        placeholder="Search actions, entities or record IDs"
        className="my-3 rounded-2xl bg-white px-4 py-3 text-textPrimary"
        autoCapitalize="none"
      />
      <View className="mb-3 flex-row gap-3">
        <TouchableOpacity
          accessibilityRole="button"
          className={buttonStyle}
          onPress={() => {
            setDraft(filters);
            setFilterOpen(true);
          }}
        >
          <Text className="font-ralewayBold text-primary">Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          className={buttonStyle}
          onPress={() => {
            setSearch("");
            setFilters({});
          }}
        >
          <Text className="font-ralewayBold text-primary">Clear</Text>
        </TouchableOpacity>
        {can("audit.export") ? (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={exporting}
            className={buttonStyle}
            onPress={exportHistory}
          >
            {exporting ? (
              <ActivityIndicator />
            ) : (
              <Text className="font-ralewayBold text-primary">Export CSV</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
      {meta ? (
        <Text className="mb-3 text-xs text-description">
          {meta.effective_start
            ? `History available from ${new Date(meta.effective_start).toLocaleDateString()}.`
            : "Unlimited history."}{" "}
          Full capture began{" "}
          {new Date(meta.capture_started_at).toLocaleDateString()}.
        </Text>
      ) : null}
      {notice ? (
        <Text accessibilityRole="alert" className="mb-3 text-red-600">
          {notice}
        </Text>
      ) : null}
      {audit.history.error ? (
        <View className="mb-3 gap-2">
          <Text accessibilityRole="alert" className="text-red-600">
            {errorMessage(audit.history.error)}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => audit.history.refetch()}
          >
            <Text className="text-primary">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={events}
        keyExtractor={(event) => event.id}
        refreshing={audit.history.isRefetching}
        onRefresh={() => audit.history.refetch()}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            className="gap-1 rounded-2xl bg-white p-4"
            onPress={() => {
              setEventId(item.id);
              setShowRecord(false);
            }}
          >
            <Text className="font-ralewayExtraBold text-textPrimary">
              {item.action}
            </Text>
            <Text className="text-sm text-description">
              {item.entity} · {item.result}
            </Text>
            <Text className="text-xs text-description">
              {item.actor_role ??
                (item.origin === "http" ? "Unknown actor" : "System")}{" "}
              {item.actor_id?.slice(0, 8) ?? ""} ·{" "}
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          audit.history.isPending ? (
            <ActivityIndicator />
          ) : !audit.history.error ? (
            <ModuleEmptyState
              title="No audit events"
              description="Try changing your search or filters."
              icon="document-text-outline"
            />
          ) : null
        }
        ListFooterComponent={
          audit.history.hasNextPage ? (
            <TouchableOpacity
              accessibilityRole="button"
              disabled={audit.history.isFetchingNextPage}
              className={buttonStyle}
              onPress={() => audit.history.fetchNextPage()}
            >
              {audit.history.isFetchingNextPage ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-center text-primary">Load more</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
      <AuditFilterSheet
        visible={filterOpen}
        draft={draft}
        onChange={setDraft}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters({ ...draft, search: search.trim() || undefined });
          setFilterOpen(false);
        }}
      />
      <AuditEventSheet
        visible={Boolean(eventId)}
        detail={audit.detail}
        record={audit.record}
        showRecord={showRecord}
        onShowRecord={() => setShowRecord(true)}
        onClose={() => {
          setEventId(null);
          setShowRecord(false);
        }}
      />
    </Screen>
  );
}
