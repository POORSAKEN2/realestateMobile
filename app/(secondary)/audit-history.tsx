import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { shareAuditHistory } from "../../api/audit";
import { AuditErrorState } from "../../components/audit/AuditErrorState";
import { AuditEventCard } from "../../components/audit/AuditEventCard";
import { AuditEventSheet } from "../../components/audit/AuditEventSheet";
import { AuditFilterSheet } from "../../components/audit/AuditFilterSheet";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { SearchToolbar } from "../../components/ui/SearchToolbar";
import { Button } from "../../components/ui/buttons/Button";
import { useAuditHistory } from "../../hooks/api/useAuditHistory";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import type { AuditFilters } from "../../types/domain/audit";
import {
  auditDate,
  auditStoragePolicyNotice,
  normalizeAuditFilters,
} from "../../utils/audit/presentation";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Audit history could not be loaded.";

export default function AuditHistoryScreen() {
  const { can } = useAccess();
  const { session } = useAuth();
  const user = session?.user as { id?: string; tenant_id?: string } | undefined;
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
  }, [user?.id, user?.tenant_id, linkedId]);
  const meta = audit.history.data?.pages[0]?.meta;
  const storagePolicyNotice = auditStoragePolicyNotice(meta?.storage_policy);
  const events = useMemo(
    () => audit.history.data?.pages.flatMap((page) => page.events) ?? [],
    [audit.history.data],
  );
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "search" && value,
  ).length;
  const hasFilters = activeFilterCount > 0 || Boolean(search.trim());
  const openEvent = useCallback((id: string) => {
    setEventId(id);
    setShowRecord(false);
  }, []);
  const renderEvent = useCallback(
    ({ item }: { item: (typeof events)[number] }) => (
      <AuditEventCard event={item} onOpen={openEvent} />
    ),
    [openEvent],
  );

  async function exportHistory() {
    setExporting(true);
    setNotice("");
    try {
      await shareAuditHistory(normalizeAuditFilters({ ...filters, search }));
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
      <FlatList
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <ModuleHeader
              title="Audit History"
              supportingText="Investigate account changes and security events."
            />
            <SearchToolbar
              accessibilityLabel="Search audit history"
              clearAccessibilityLabel="Clear audit search"
              filterAccessibilityLabel="Open audit filters"
              placeholder="Search actions, entities or record IDs"
              value={search}
              onChangeText={setSearch}
              activeFilterCount={activeFilterCount}
              hasActiveFilters={activeFilterCount > 0}
              onFilterPress={() => {
                setDraft(filters);
                setFilterOpen(true);
              }}
              resultLabel={
                audit.history.isPending
                  ? "Loading history…"
                  : `${events.length} ${events.length === 1 ? "event" : "events"} loaded`
              }
              filterLabel={
                activeFilterCount
                  ? `${activeFilterCount} active ${activeFilterCount === 1 ? "filter" : "filters"}`
                  : undefined
              }
            />
            <View className="flex-row flex-wrap gap-3">
              {hasFilters ? (
                <Button
                  title="Clear all"
                  variant="secondary"
                  onPress={() => {
                    setSearch("");
                    setFilters({});
                  }}
                />
              ) : null}
              {can("audit.export") ? (
                <Button
                  title="Export CSV"
                  variant="secondary"
                  isLoading={exporting}
                  onPress={() => {
                    void exportHistory();
                  }}
                />
              ) : null}
            </View>
            {meta ? (
              <Text className="text-xs leading-5 text-description">
                {meta.effective_start
                  ? `Showing history from ${auditDate(meta.effective_start)}.`
                  : "Unlimited history."}
                {meta.capture_started_at
                  ? ` Full capture began ${auditDate(meta.capture_started_at)}.`
                  : ""}
              </Text>
            ) : null}
            {storagePolicyNotice ? (
              <Text className="text-xs leading-5 text-description">
                {storagePolicyNotice}
              </Text>
            ) : null}
            {notice ? (
              <Text accessibilityRole="alert" className="text-sm text-red-700">
                {notice}
              </Text>
            ) : null}
            {audit.history.error ? (
              <AuditErrorState
                error={audit.history.error}
                retrying={audit.history.isFetching}
                onRetry={() => {
                  void audit.history.refetch();
                }}
              />
            ) : null}
          </View>
        }
        data={events}
        keyExtractor={(event) => event.id}
        refreshing={audit.history.isRefetching}
        onRefresh={() => audit.history.refetch()}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        renderItem={renderEvent}
        ListEmptyComponent={
          audit.history.isPending ? (
            <ActivityIndicator />
          ) : !audit.history.error ? (
            <ModuleEmptyState
              title="No audit events"
              description={
                hasFilters
                  ? "Try changing your search or filters."
                  : "Account changes and security events will appear here."
              }
              icon="document-text-outline"
            />
          ) : null
        }
        ListFooterComponent={
          audit.history.hasNextPage ? (
            <Button
              title="Load more"
              variant="secondary"
              isLoading={audit.history.isFetchingNextPage}
              onPress={() => {
                if (!audit.history.isFetching)
                  void audit.history.fetchNextPage();
              }}
            />
          ) : null
        }
      />
      <AuditFilterSheet
        visible={filterOpen}
        draft={draft}
        entities={meta?.entities}
        onChange={setDraft}
        onClose={() => setFilterOpen(false)}
        onApply={() => {
          setFilters(normalizeAuditFilters({ ...draft, search }));
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
