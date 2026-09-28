import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  cancelAccountDeletion,
  fetchAccountDeletionRequest,
  requestAccountDeletion,
  respondToAccountDeletion,
} from "../../api/user";
import { colors } from "../../constants/colors";
import { deletionStatusLabel } from "../../utils/accountDeletion/accountDeletion";
import { formatDateTime } from "../../utils/formatters";
import { BaseField } from "../ui/fields/BaseField";

const key = ["account-deletion-request"] as const;
const label = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());

export function AccountDeletionCard() {
  const client = useQueryClient();
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [response, setResponse] = useState("");
  const request = useQuery({
    queryKey: key,
    queryFn: fetchAccountDeletionRequest,
  });
  const refresh = async () => {
    setPassword("");
    setReason("");
    setResponse("");
    await client.invalidateQueries({ queryKey: key });
  };
  const submit = useMutation({
    mutationFn: () =>
      requestAccountDeletion({
        current_password: password,
        reason: reason.trim() || undefined,
        confirmation: true,
      }),
    onSuccess: refresh,
  });
  const respond = useMutation({
    mutationFn: () =>
      respondToAccountDeletion(request.data!.id, {
        current_password: password,
        response: response.trim(),
      }),
    onSuccess: refresh,
  });
  const cancel = useMutation({
    mutationFn: () => cancelAccountDeletion(request.data!.id),
    onSuccess: refresh,
  });
  const error = submit.error ?? respond.error ?? cancel.error ?? request.error;
  const current = request.data;
  const busy = submit.isPending || respond.isPending || cancel.isPending;
  const canSubmit = !current || current.available_actions.includes("submit");
  const confirmSubmit = () =>
    Alert.alert(
      "Request account deletion?",
      "An administrator will review impact before any deletion. Approved requests have a 14-day recovery period.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: () => submit.mutate(),
        },
      ],
    );

  return (
    <View className="mt-5 rounded-[28px] border border-danger/25 bg-panel p-5 shadow-sm shadow-primary/10">
      <Text className="font-ralewayExtraBold text-lg text-textPrimary">
        Account deletion
      </Text>
      <Text className="mt-1 text-sm leading-6 text-description">
        Identity verification and deletion decisions are enforced by Terrane
        servers.
      </Text>

      {request.isPending ? (
        <ActivityIndicator className="mt-5" color={colors.primary} />
      ) : request.isError ? (
        <TouchableOpacity
          className="mt-4 h-12 items-center justify-center rounded-2xl border border-primary/30"
          onPress={() => request.refetch()}
        >
          <Text className="font-ralewayExtraBold text-primary">
            Retry status check
          </Text>
        </TouchableOpacity>
      ) : current ? (
        <View className="mt-4 gap-4">
          <View className="rounded-2xl bg-primary/10 p-4">
            <Text className="font-ralewayExtraBold text-xs uppercase text-primary">
              {deletionStatusLabel(current.status)} · {label(current.scope)}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-description">
              {current.impact?.summary}
            </Text>
            {current.scheduled_for ? (
              <Text className="mt-2 font-ralewayBold text-sm text-danger">
                Final deletion: {formatDateTime(current.scheduled_for)}
              </Text>
            ) : null}
            {current.decision_reason ? (
              <Text className="mt-2 text-sm text-description">
                Decision: {current.decision_reason}
              </Text>
            ) : null}
            {current.failure_reason ? (
              <Text className="mt-2 text-sm text-danger">
                {current.failure_reason}
              </Text>
            ) : null}
          </View>

          {current.history.length ? (
            <View className="gap-2 rounded-2xl border border-primary/10 p-4">
              <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                Timeline
              </Text>
              {current.history.map((event) => (
                <View
                  key={`${event.status}-${event.at}`}
                  className="flex-row justify-between gap-3"
                >
                  <Text className="flex-1 text-sm text-description">
                    {event.label}
                  </Text>
                  <Text className="text-xs text-description">
                    {formatDateTime(event.at)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {current.available_actions.includes("respond") ? (
            <>
              <Text className="text-sm text-description">
                Administrator asks: {current.information_requested}
              </Text>
              <BaseField
                label="Your response"
                required
                multiline
                placeholder="Your response"
                editable={!busy}
                value={response}
                onChangeText={setResponse}
              />
              <BaseField
                label="Current password"
                required
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                editable={!busy}
                placeholder="Current password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                className="h-12 items-center justify-center rounded-2xl bg-primary"
                disabled={busy || !response.trim() || !password}
                onPress={() => respond.mutate()}
              >
                <Text className="font-ralewayExtraBold text-white">
                  Submit response
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {current.available_actions.includes("cancel") ? (
            <TouchableOpacity
              className="h-12 items-center justify-center rounded-2xl border border-danger/30"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  "Cancel deletion request?",
                  "Your account will remain active.",
                  [
                    { text: "Keep request", style: "cancel" },
                    { text: "Cancel request", onPress: () => cancel.mutate() },
                  ],
                )
              }
            >
              <Text className="font-ralewayExtraBold text-danger">
                Cancel request
              </Text>
            </TouchableOpacity>
          ) : null}

          {canSubmit ? (
            <View className="mt-2 gap-4 border-t border-primary/10 pt-4">
              <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                Submit another request
              </Text>
              <BaseField
                label="Reason (optional)"
                multiline
                placeholder="Tell us why you're leaving"
                editable={!busy}
                value={reason}
                onChangeText={setReason}
              />
              <BaseField
                label="Current password"
                required
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                editable={!busy}
                placeholder="Current password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                className="h-12 items-center justify-center rounded-2xl bg-danger"
                disabled={busy || !password}
                onPress={confirmSubmit}
              >
                {submit.isPending ? (
                  <ActivityIndicator color={colors.onDanger} />
                ) : (
                  <Text className="font-ralewayExtraBold text-onDanger">
                    Request account deletion
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="mt-4 gap-4">
          <BaseField
            label="Reason (optional)"
            multiline
            placeholder="Tell us why you're leaving"
            editable={!busy}
            value={reason}
            onChangeText={setReason}
          />
          <BaseField
            label="Current password"
            required
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            editable={!busy}
            placeholder="Current password"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            className="h-12 items-center justify-center rounded-2xl bg-danger"
            disabled={busy || !password}
            onPress={confirmSubmit}
          >
            {busy ? (
              <ActivityIndicator color={colors.onDanger} />
            ) : (
              <Text className="font-ralewayExtraBold text-onDanger">
                Request account deletion
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <Text accessibilityRole="alert" className="mt-3 text-sm text-danger">
          {error instanceof Error
            ? error.message
            : "Deletion request could not be updated."}
        </Text>
      ) : null}
    </View>
  );
}
