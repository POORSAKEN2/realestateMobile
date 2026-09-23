import { Text } from "react-native";
import { auditLabel } from "../../utils/audit/presentation";

const results: Record<string, { label: string; className: string }> = {
  success: { label: "Success", className: "bg-emerald-50 text-emerald-700" },
  failure: { label: "Failed", className: "bg-red-50 text-red-700" },
  denied: { label: "Denied", className: "bg-amber-50 text-amber-800" },
};

export function AuditResultBadge({ result }: { result: string }) {
  const presentation = results[result] ?? {
    label: auditLabel(result),
    className: "bg-surface text-description",
  };
  return (
    <Text
      className={`shrink-0 rounded-full px-2.5 py-1 font-ralewayBold text-xs ${presentation.className}`}
    >
      {presentation.label}
    </Text>
  );
}
