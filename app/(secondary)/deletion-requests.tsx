import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { ApiError } from "../../api/errors";
import {
  decideAccountDeletion,
  fetchAccountDeletionDetail,
  fetchAccountDeletionQueue,
  retryAccountDeletion,
} from "../../api/user";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { ModuleEmptyState } from "../../components/ui/ModuleState";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { useAccess } from "../../hooks/auth/useAccess";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import type {
  AccountDeletionRequest,
  DeletionAction,
  DeletionScope,
  DeletionStatus,
} from "../../types";
import {
  deletionStatusLabel,
  subscriptionCancellationMessage,
} from "../../utils/accountDeletion/accountDeletion";

const queueKey = ["account-deletion-queue"] as const;
const words = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const statusFilters: Array<DeletionStatus | undefined> = [
  undefined,
  "pending",
  "information_required",
  "approved",
  "scheduled",
  "processing",
  "failed",
  "completed",
  "rejected",
  "cancelled",
];
const scopeFilters: Array<DeletionScope | undefined> = [
  undefined,
  "user",
  "tenant",
];

export default function DeletionRequestsScreen() {
  const { can } = useAccess();
  const revenueCat = useRevenueCat();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const linked = Array.isArray(params.id) ? params.id[0] : params.id;
  const [selectedId, setSelectedId] = useState<string | null>(linked ?? null);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<DeletionStatus | undefined>();
  const [scope, setScope] = useState<DeletionScope | undefined>();
  const [page, setPage] = useState(1);
  const allowed = can("account.reviewDeletionRequests");
  const queue = useQuery({
    queryKey: [...queueKey, status ?? "all", scope ?? "all", page],
    queryFn: () => fetchAccountDeletionQueue({ status, scope, page }),
    enabled: allowed,
  });
  const detail = useQuery({
    queryKey: [...queueKey, selectedId],
    queryFn: () => fetchAccountDeletionDetail(selectedId!),
    enabled: allowed && Boolean(selectedId),
  });
  useEffect(() => setSelectedId(linked ?? null), [linked]);
  const update = useMutation({
    mutationFn: async ({
      action,
      item,
    }: {
      action: DeletionAction;
      item: AccountDeletionRequest;
    }) => {
      if (action === "retry") return retryAccountDeletion(item.id);
      return decideAccountDeletion(item.id, {
        action: action as "approve" | "reject" | "request_information",
        reason: reason.trim() || undefined,
        confirmation: action === "approve",
      });
    },
    onSuccess: async (item) => {
      setReason("");
      client.setQueryData([...queueKey, item.id], item);
      await client.invalidateQueries({ queryKey: queueKey });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? subscriptionCancellationMessage(error)
          : null;
      if (message) {
        Alert.alert("Store cancellation required", message, [
          { text: "Not now", style: "cancel" },
          {
            text: "Open Customer Center",
            onPress: () => void revenueCat.presentCustomerCenter(),
          },
        ]);
      }
    },
  });

  if (!allowed)
    return (
      <Screen>
        <SecondaryBackButton />
        <ModuleEmptyState
          icon="lock-closed-outline"
          title="Access unavailable"
          description="Deletion review is available to account administrators."
        />
      </Screen>
    );
  const selected = detail.data;

  return (
    <Screen className="bg-surface">
      <SecondaryBackButton />
      <FlatList
        data={queue.data?.data ?? []}
        keyExtractor={(item) => item.id}
        refreshing={queue.isRefetching}
        onRefresh={() => queue.refetch()}
        contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <ModuleHeader
              title="Deletion requests"
              supportingText="Review verified personal-data and tenant-closure requests."
            />
            <View className="gap-2">
              <Text className="font-ralewayExtraBold text-xs uppercase text-description">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {statusFilters.map((value) => (
                  <TouchableOpacity
                    key={value ?? "all"}
                    className={`rounded-full px-3 py-2 ${status === value ? "bg-primary" : "border border-primary/20 bg-white"}`}
                    onPress={() => {
                      setStatus(value);
                      setPage(1);
                    }}
                  >
                    <Text
                      className={`text-xs ${status === value ? "text-white" : "text-primary"}`}
                    >
                      {value ? words(value) : "All"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className="mt-1 font-ralewayExtraBold text-xs uppercase text-description">
                Scope
              </Text>
              <View className="flex-row gap-2">
                {scopeFilters.map((value) => (
                  <TouchableOpacity
                    key={value ?? "all"}
                    className={`rounded-full px-3 py-2 ${scope === value ? "bg-primary" : "border border-primary/20 bg-white"}`}
                    onPress={() => {
                      setScope(value);
                      setPage(1);
                    }}
                  >
                    <Text
                      className={`text-xs ${scope === value ? "text-white" : "text-primary"}`}
                    >
                      {value ? words(value) : "All"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {queue.error ? (
              <View className="gap-2">
                <Text className="text-danger">
                  {queue.error instanceof Error
                    ? queue.error.message
                    : "Queue unavailable."}
                </Text>
                <TouchableOpacity
                  className="h-11 items-center justify-center rounded-2xl border border-primary/30"
                  onPress={() => queue.refetch()}
                >
                  <Text className="font-ralewayBold text-primary">
                    Retry queue
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {queue.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : null}
            {queue.data && queue.data.last_page > 1 ? (
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  disabled={page <= 1}
                  className="rounded-xl border border-primary/20 px-4 py-2 disabled:opacity-40"
                  onPress={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <Text className="font-ralewayBold text-primary">
                    Previous
                  </Text>
                </TouchableOpacity>
                <Text className="text-sm text-description">
                  Page {queue.data.current_page} of {queue.data.last_page}
                </Text>
                <TouchableOpacity
                  disabled={page >= queue.data.last_page}
                  className="rounded-xl border border-primary/20 px-4 py-2 disabled:opacity-40"
                  onPress={() => setPage((value) => value + 1)}
                >
                  <Text className="font-ralewayBold text-primary">Next</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !queue.isPending && !queue.error ? (
            <ModuleEmptyState
              icon="shield-checkmark-outline"
              title="Queue clear"
              description="No deletion requests match these filters."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="rounded-2xl border border-primary/20 bg-white p-4"
            onPress={() => setSelectedId(item.id)}
          >
            <View className="flex-row justify-between gap-3">
              <Text className="flex-1 font-ralewayExtraBold text-textPrimary">
                {item.requester?.name ?? "Deleted requester"}
              </Text>
              <Text className="font-ralewayBold text-xs uppercase text-primary">
                {deletionStatusLabel(item.status)}
              </Text>
            </View>
            <Text className="mt-1 text-sm text-description">
              {words(item.scope)} ·{" "}
              {item.requested_at
                ? new Date(item.requested_at).toLocaleString()
                : "Unknown date"}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          selectedId ? (
            <View className="mt-5 rounded-[28px] border border-primary/20 bg-white p-5">
              {detail.isPending ? (
                <ActivityIndicator color={colors.primary} />
              ) : selected ? (
                <>
                  <Text className="font-ralewayExtraBold text-xl text-textPrimary">
                    {selected.requester?.name}
                  </Text>
                  <Text className="mt-1 text-sm text-description">
                    {selected.requester?.email} · {words(selected.scope)} ·{" "}
                    {words(selected.status)}
                  </Text>
                  {selected.reviewer ? (
                    <Text className="mt-1 text-sm text-description">
                      Reviewed by {selected.reviewer.name}
                    </Text>
                  ) : null}
                  <Text className="mt-3 text-sm leading-6 text-description">
                    {selected.impact?.summary}
                  </Text>
                  <View className="mt-3 gap-2">
                    {selected.impact?.groups.map((group) => (
                      <View
                        key={group.code}
                        className="flex-row justify-between"
                      >
                        <Text className="text-sm text-description">
                          {group.label}
                        </Text>
                        <Text className="font-ralewayBold text-sm text-textPrimary">
                          {group.count} · {words(group.retention_action)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {selected.information_requested ? (
                    <Text className="mt-3 text-sm text-description">
                      Requested: {selected.information_requested}
                    </Text>
                  ) : null}
                  {selected.requester_response ? (
                    <Text className="mt-1 text-sm text-description">
                      Response: {selected.requester_response}
                    </Text>
                  ) : null}
                  {selected.failure_reason ? (
                    <Text className="mt-3 text-sm text-danger">
                      {selected.failure_reason}
                    </Text>
                  ) : null}
                  {selected.scope === "tenant" &&
                  selected.subscription_blocker ? (
                    <Text className="mt-3 text-sm text-description">
                      Subscription:{" "}
                      {words(
                        String(
                          selected.subscription_blocker.status ??
                            selected.subscription_blocker.access_mode ??
                            "unknown",
                        ),
                      )}
                    </Text>
                  ) : null}
                  {selected.history.length ? (
                    <View className="mt-4 gap-2 rounded-2xl bg-primary/5 p-4">
                      <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                        Status history
                      </Text>
                      {selected.history.map((event) => (
                        <View
                          key={`${event.status}-${event.at}`}
                          className="flex-row justify-between gap-3"
                        >
                          <Text className="flex-1 text-sm text-description">
                            {event.label}
                          </Text>
                          <Text className="text-xs text-description">
                            {new Date(event.at).toLocaleString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {selected.available_actions.some((action) =>
                    ["reject", "request_information"].includes(action),
                  ) ? (
                    <TextInput
                      className="mt-4 min-h-20 rounded-2xl border border-primary/20 px-4 py-3 text-textPrimary"
                      multiline
                      placeholder="Required reason or information request"
                      placeholderTextColor={colors.description}
                      value={reason}
                      onChangeText={setReason}
                    />
                  ) : null}
                  <View className="mt-4 gap-2">
                    {selected.available_actions
                      .filter((action) =>
                        [
                          "approve",
                          "reject",
                          "request_information",
                          "retry",
                        ].includes(action),
                      )
                      .map((action) => (
                        <TouchableOpacity
                          key={action}
                          className={`h-12 items-center justify-center rounded-2xl ${action === "approve" ? "bg-danger" : "border border-primary/30"}`}
                          disabled={
                            update.isPending ||
                            (["reject", "request_information"].includes(
                              action,
                            ) &&
                              !reason.trim())
                          }
                          onPress={() =>
                            Alert.alert(
                              `${words(action)} request?`,
                              action === "approve"
                                ? "Access ends immediately. Final deletion follows after 14 days."
                                : "This decision is recorded in audit history.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: words(action),
                                  style:
                                    action === "approve"
                                      ? "destructive"
                                      : "default",
                                  onPress: () =>
                                    update.mutate({ action, item: selected }),
                                },
                              ],
                            )
                          }
                        >
                          <Text
                            className={`font-ralewayExtraBold ${action === "approve" ? "text-white" : "text-primary"}`}
                          >
                            {words(action)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                  {update.error &&
                  !(
                    update.error instanceof ApiError &&
                    update.error.code === "subscription_cancellation_required"
                  ) ? (
                    <Text className="mt-3 text-danger">
                      {update.error instanceof Error
                        ? update.error.message
                        : "Request update failed."}
                    </Text>
                  ) : null}
                </>
              ) : (
                <View className="gap-2">
                  <Text className="text-danger">
                    {detail.error instanceof Error
                      ? detail.error.message
                      : "Request could not be loaded."}
                  </Text>
                  <TouchableOpacity
                    className="h-11 items-center justify-center rounded-2xl border border-primary/30"
                    onPress={() => detail.refetch()}
                  >
                    <Text className="font-ralewayBold text-primary">
                      Retry request
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null
        }
      />
    </Screen>
  );
}
