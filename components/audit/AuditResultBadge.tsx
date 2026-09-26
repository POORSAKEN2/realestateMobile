import { Text } from "react-native";
import { auditLabel } from "../../utils/audit/presentation";

const results: Record<string, { label: string; className: string }> = {
  success: { label: "Success", className: "bg-successSurface text-success" },
  failure: { label: "Failed", className: "bg-dangerSurface text-danger" },
  denied: { label: "Denied", className: "bg-warningSurface text-warning" },
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
