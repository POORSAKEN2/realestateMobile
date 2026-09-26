import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/colors";
import { useExpenseGovernance } from "../../hooks/expenses/useExpenseGovernance";
import { validateExpenseTransitionReason } from "../../utils/expenses/expenseGovernance";
import type { ExpenseLifecycleStatus } from "../../types/domain/expenses";
import { formatPeso } from "../../utils/expenses/expenseForm";
import { formatDateTime } from "../../utils/formatters";
import { BottomSheetModal } from "../ui/BottomSheetModal";
import { BaseField } from "../ui/fields/BaseField";
import { ModalHeader } from "../ui/ModalHeader";

type PendingAction =
  | { kind: "transition"; status: ExpenseLifecycleStatus }
  | { kind: "retire"; mediaId: string };

export function ExpenseGovernanceSheet({
  expenseId,
  onClose,
  onEdit,
}: {
  expenseId: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const governance = useExpenseGovernance(expenseId, Boolean(expenseId));
  const expense = governance.detail.data;
  const activities =
    governance.activity.data?.pages.flatMap((page) => page.items) ?? [];
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const isPending =
    governance.transition.isPending || governance.retireEvidence.isPending;

  async function uploadEvidence() {
    setError("");
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    try {
      await governance.uploadEvidence.mutateAsync(
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
          file: asset.file,
        })),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Evidence upload failed.",
      );
    }
  }

  function closeReason() {
    if (isPending) return;
    setPendingAction(null);
    setReason("");
    setError("");
  }

  async function submitReason() {
    const validationError = validateExpenseTransitionReason(true, reason);
    if (!pendingAction || validationError) {
      setError(validationError ?? "Action unavailable.");
      return;
    }
    try {
      if (pendingAction.kind === "transition") {
        await governance.transition.mutateAsync({
          status: pendingAction.status,
          reason,
        });
      } else {
        await governance.retireEvidence.mutateAsync({
          mediaId: pendingAction.mediaId,
          reason,
        });
      }
      closeReason();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    }
  }

  async function runTransition(
    status: ExpenseLifecycleStatus,
    requiresReason: boolean,
  ) {
    if (requiresReason) {
      setPendingAction({ kind: "transition", status });
      return;
    }
    setError("");
    try {
      await governance.transition.mutateAsync({ status });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Status update failed.",
      );
    }
  }

  return (
    <>
      <BottomSheetModal
        onClose={onClose}
        visible={Boolean(expenseId)}
        bottomInsetMode="safe-area"
      >
        <SafeAreaView
          edges={["bottom"]}
          className="max-h-[92%] rounded-t-[28px] bg-panel"
        >
          <ModalHeader
            title="Expense governance"
            subtitle="ADMIN lifecycle and immutable activity"
            onClose={onClose}
          />
          {governance.detail.isLoading ? (
            <View className="items-center p-10">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : governance.detail.isError || !expense ? (
            <View className="items-center gap-3 p-8">
              <Text className="text-center text-sm text-danger">
                {governance.detail.error?.message ?? "Expense unavailable."}
              </Text>
              <TouchableOpacity
                onPress={() => governance.detail.refetch()}
                className="rounded-xl bg-primary px-4 py-3"
              >
                <Text className="font-ralewayBold text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                gap: 16,
                padding: 20,
                paddingBottom: 36,
              }}
            >
              <View className="rounded-2xl bg-primary/10 p-4">
                <Text className="font-ralewayExtraBold text-lg text-textPrimary">
                  {expense.description || expense.category}
                </Text>
                <Text className="mt-1 font-ralewayMedium text-sm text-description">
                  {formatPeso(expense.amount)} · {expense.lifecycle_status}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => onEdit(expense.id)}
                    className="rounded-xl border border-primary px-3 py-2"
                  >
                    <Text className="font-ralewayBold text-primary">
                      Edit record
                    </Text>
                  </TouchableOpacity>
                  {expense.allowed_transitions.map((transition) => (
                    <TouchableOpacity
                      key={transition.status}
                      disabled={isPending}
                      onPress={() =>
                        runTransition(
                          transition.status,
                          transition.requires_reason,
                        )
                      }
                      className="rounded-xl bg-primary px-3 py-2"
                    >
                      <Text className="font-ralewayBold text-white">
                        Mark {transition.status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {error ? (
                <Text className="rounded-xl bg-dangerSurface p-3 text-sm text-danger">
                  {error}
                </Text>
              ) : null}

              <View>
                <View className="flex-row items-center justify-between">
                  <Text className="font-ralewayBold text-sm uppercase text-textPrimary">
                    Evidence
                  </Text>
                  <TouchableOpacity
                    disabled={governance.uploadEvidence.isPending}
                    onPress={uploadEvidence}
                    className="rounded-lg bg-primary px-3 py-2"
                  >
                    <Text className="font-ralewayBold text-xs text-white">
                      {governance.uploadEvidence.isPending
                        ? "Uploading…"
                        : "Add evidence"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="mt-2 gap-2">
                  {expense.receipts?.length ? (
                    expense.receipts.map((receipt) => (
                      <View
                        key={receipt.id}
                        className="flex-row items-center rounded-2xl border border-textPrimary/10 p-3"
                      >
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={20}
                          color={colors.primary}
                        />
                        <TouchableOpacity
                          className="ml-2 min-w-0 flex-1"
                          onPress={() => Linking.openURL(receipt.url)}
                          disabled={receipt.state === "Retired"}
                        >
                          <Text
                            numberOfLines={1}
                            className="font-ralewayBold text-sm text-textPrimary"
                          >
                            {receipt.name ?? receipt.file_name ?? "Evidence"}
                          </Text>
                          <Text className="text-xs text-description">
                            {receipt.state}
                          </Text>
                        </TouchableOpacity>
                        {receipt.state === "Active" ? (
                          <TouchableOpacity
                            onPress={() =>
                              setPendingAction({
                                kind: "retire",
                                mediaId: receipt.id,
                              })
                            }
                            className="rounded-lg bg-dangerSurface px-3 py-2"
                          >
                            <Text className="font-ralewayBold text-xs text-danger">
                              Retire
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))
                  ) : (
                    <Text className="text-sm text-description">
                      No evidence attached.
                    </Text>
                  )}
                </View>
              </View>

              <View>
                <Text className="font-ralewayBold text-sm uppercase text-textPrimary">
                  Activity
                </Text>
                {governance.activity.isLoading ? (
                  <ActivityIndicator className="mt-4" color={colors.primary} />
                ) : null}
                {governance.activity.isError ? (
                  <TouchableOpacity
                    onPress={() => governance.activity.refetch()}
                    className="mt-3 rounded-xl bg-dangerSurface p-3"
                  >
                    <Text className="text-center text-danger">
                      Load failed. Retry
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <View className="mt-2 gap-2">
                  {activities.map((item) => (
                    <View
                      key={`${item.type}:${item.id}`}
                      className="rounded-2xl border border-textPrimary/10 p-3"
                    >
                      <Text className="font-ralewayBold text-sm text-textPrimary">
                        {item.action
                          .replaceAll("expense.", "")
                          .replaceAll("_", " ")}
                      </Text>
                      <Text className="mt-1 text-xs text-description">
                        {item.actor?.name ?? item.actor?.role ?? "System"} ·{" "}
                        {formatDateTime(item.occurred_at)}
                      </Text>
                      {item.reason ? (
                        <Text className="mt-2 text-sm text-textPrimary">
                          {item.reason}
                        </Text>
                      ) : null}
                      {item.type === "transition" ? (
                        <Text className="mt-2 text-xs text-description">
                          {String(item.before_values.lifecycle_status)} to{" "}
                          {String(item.after_values.lifecycle_status)}
                        </Text>
                      ) : null}
                      {item.type === "edit" &&
                      Object.keys(item.after_values).length ? (
                        <Text className="mt-2 text-xs text-description">
                          {Object.entries(item.after_values)
                            .map(
                              ([key, value]) =>
                                `${key.replaceAll("_", " ")}: ${String(value ?? "—")}`,
                            )
                            .join(" · ")}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                  {!governance.activity.isLoading && !activities.length ? (
                    <Text className="text-sm text-description">
                      No activity recorded.
                    </Text>
                  ) : null}
                </View>
                {governance.activity.hasNextPage ? (
                  <TouchableOpacity
                    disabled={governance.activity.isFetchingNextPage}
                    onPress={() => governance.activity.fetchNextPage()}
                    className="mt-3 rounded-xl border border-primary p-3"
                  >
                    <Text className="text-center font-ralewayBold text-primary">
                      {governance.activity.isFetchingNextPage
                        ? "Loading…"
                        : "Load earlier activity"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </BottomSheetModal>

      <Modal
        visible={Boolean(pendingAction)}
        transparent
        animationType="fade"
        onRequestClose={closeReason}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-[480px] rounded-[24px] bg-panel p-5">
            <Text className="font-ralewayExtraBold text-lg text-textPrimary">
              Reason required
            </Text>
            <View className="mt-4">
              <BaseField
                label="Reason"
                required
                multiline
                value={reason}
                onChangeText={setReason}
                placeholder="Explain this governance action"
                variant="filled"
              />
            </View>
            {error ? (
              <Text className="mt-2 text-sm text-danger">{error}</Text>
            ) : null}
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                disabled={isPending}
                onPress={closeReason}
                className="flex-1 items-center rounded-xl border border-textPrimary/10 p-3"
              >
                <Text className="font-ralewayBold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isPending}
                onPress={submitReason}
                className="flex-1 items-center rounded-xl bg-primary p-3"
              >
                <Text className="font-ralewayBold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
