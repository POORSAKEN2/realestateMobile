import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../constants/colors";
import type {
  VerificationPolicy,
  VerificationRecord,
} from "../../../types/domain/propertyVerification";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { Button } from "../../ui/buttons/Button";

const statusClasses: Record<string, string> = {
  approved: "bg-successSurface text-success",
  pending: "bg-infoSurface text-info",
  draft: "bg-primary/10 text-primary",
  rejected: "bg-dangerSurface text-danger",
  revoked: "bg-dangerSurface text-danger",
  invalidated: "bg-dangerSurface text-danger",
  expired: "bg-warningSurface text-warning",
};
function words(value: string) {
  return value.replace(/_/g, " ").replace(/^./, (first) => first.toUpperCase());
}

export function VerificationRecordCard({
  record,
  policy,
  pending,
  onInspect,
  onUpload,
  onSubmit,
  onWithdraw,
}: {
  record: VerificationRecord;
  policy: VerificationPolicy;
  pending: boolean;
  onInspect: (id: string, name: string) => void;
  onUpload: (type: string) => void;
  onSubmit: () => void;
  onWithdraw: () => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(record.status === "draft");
  const required = policy.levels[record.level]?.required_evidence ?? [];
  const uploadedTypes = new Set(record.evidence.map((file) => file.type));
  const missing = required.filter((type) => !uploadedTypes.has(type));
  return (
    <View className="gap-3 rounded-xl border border-primary/15 p-3">
      <View className="flex-row items-start gap-2">
        <Text className="min-w-0 flex-1 font-ralewayBold text-sm text-textPrimary">
          {policy.levels[record.level]?.label ?? words(record.level)}
        </Text>
        <Text
          className={`rounded-full px-2 py-1 font-ralewayBold text-[10px] ${statusClasses[record.status] ?? "bg-surface text-description"}`}
        >
          {words(record.status)}
        </Text>
      </View>
      {record.submitted_at ? (
        <Text className="text-xs text-description">
          Submitted {formatDate(record.submitted_at)}
        </Text>
      ) : null}
      {record.expires_at ? (
        <Text className="text-xs text-description">
          Expires {formatDate(record.expires_at)}
        </Text>
      ) : null}
      {record.status === "pending" ? (
        <Text className="text-xs leading-5 text-description">
          Submitted to Support. Approval is required before publishing.
        </Text>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: evidenceOpen }}
        className="min-h-11 flex-row items-center justify-between gap-2"
        onPress={() => setEvidenceOpen((value) => !value)}
      >
        <Text className="font-ralewayBold text-sm text-primary">
          Evidence · {record.evidence.length} file
          {record.evidence.length === 1 ? "" : "s"}
        </Text>
        <Feather
          name={evidenceOpen ? "chevron-up" : "chevron-down"}
          color={colors.primary}
          size={18}
        />
      </TouchableOpacity>
      {evidenceOpen ? (
        <View className="gap-2">
          {record.evidence.map((file) => (
            <TouchableOpacity
              key={file.id}
              accessibilityRole="button"
              accessibilityLabel={`Inspect ${file.name}`}
              disabled={pending}
              className="min-h-14 flex-row items-center gap-3 rounded-xl bg-surface p-3"
              onPress={() => onInspect(file.id, file.name)}
            >
              <Feather name="file-text" color={colors.primary} size={18} />
              <View className="min-w-0 flex-1">
                <Text
                  className="font-ralewaySemiBold text-xs text-textPrimary"
                  numberOfLines={2}
                >
                  {file.name}
                </Text>
                <Text className="mt-1 text-[11px] text-description">
                  {policy.evidence_types[file.type] ?? words(file.type)} ·{" "}
                  {Math.max(1, Math.round(file.size / 1024))} KB
                </Text>
              </View>
              <Feather
                name="external-link"
                color={colors.description}
                size={15}
              />
            </TouchableOpacity>
          ))}
          {record.allowed_actions.includes("upload") ? (
            <>
              <Text className="text-xs leading-5 text-description">
                PDF, JPEG or PNG · Up to {Math.round(policy.max_file_kb / 1024)}{" "}
                MB per file. Evidence stays private.
              </Text>
              {required.map((type) => (
                <View key={type} className="gap-2 rounded-xl bg-surface p-3">
                  <Text
                    className={`font-ralewaySemiBold text-xs ${uploadedTypes.has(type) ? "text-success" : "text-description"}`}
                  >
                    {uploadedTypes.has(type) ? "✓ Uploaded: " : "Required: "}
                    {policy.evidence_types[type] ?? words(type)}
                  </Text>
                  <Button
                    title={
                      uploadedTypes.has(type)
                        ? "Add another file"
                        : "Upload evidence"
                    }
                    variant="secondary"
                    disabled={
                      pending || record.evidence.length >= policy.max_files
                    }
                    onPress={() => onUpload(type)}
                  />
                </View>
              ))}
              {record.evidence.length >= policy.max_files ? (
                <Text className="text-xs text-warning">
                  Evidence file limit reached.
                </Text>
              ) : null}
            </>
          ) : !record.evidence.length ? (
            <Text className="text-xs text-description">
              No evidence attached.
            </Text>
          ) : null}
        </View>
      ) : null}
      {record.allowed_actions.includes("submit") ? (
        <>
          <Text className="text-xs text-description">
            {missing.length
              ? `${missing.length} required evidence type${missing.length === 1 ? "" : "s"} still missing.`
              : "All required evidence attached. Ready to submit."}
          </Text>
          <Button
            title="Submit for review"
            disabled={pending || missing.length > 0}
            onPress={onSubmit}
          />
        </>
      ) : null}
      {record.allowed_actions.includes("withdraw") ? (
        <Button
          title="Withdraw request"
          variant="secondary"
          disabled={pending}
          onPress={() =>
            Alert.alert(
              "Withdraw review?",
              "Evidence history is retained. You can submit a fresh review.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Withdraw", onPress: onWithdraw },
              ],
            )
          }
        />
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: historyOpen }}
        className="min-h-11 flex-row items-center justify-between gap-2"
        onPress={() => setHistoryOpen((value) => !value)}
      >
        <Text className="font-ralewaySemiBold text-xs text-description">
          Decision history · {record.history.length}
        </Text>
        <Feather
          name={historyOpen ? "chevron-up" : "chevron-down"}
          color={colors.description}
          size={17}
        />
      </TouchableOpacity>
      {historyOpen ? (
        <View className="gap-3 border-t border-primary/10 pt-3">
          {record.history.map((event) => (
            <View key={event.id} className="gap-1">
              <Text className="font-ralewaySemiBold text-xs text-textPrimary">
                {words(event.action)} ·{" "}
                {event.actor_role === "RAZE_SUPPORT"
                  ? "Support"
                  : words(event.actor_role)}
              </Text>
              <Text className="text-[11px] text-description">
                {formatDateTime(event.effective_at)}
              </Text>
              {event.reason ? (
                <Text className="text-xs leading-5 text-description">
                  {event.reason}
                </Text>
              ) : null}
            </View>
          ))}
          {!record.history.length ? (
            <Text className="text-xs text-description">No decisions yet.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
