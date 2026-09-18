import { Text, View } from "react-native";
import { auditLabel, auditValue } from "../../utils/audit/presentation";

export function AuditValues({
  title,
  values,
  compact = false,
}: {
  title: string;
  compact?: boolean;
  values: Record<string, unknown>;
}) {
  const entries = Object.entries(values);
  return (
    <View className="gap-2">
      <Text
        accessibilityRole="header"
        className="font-ralewayExtraBold text-base text-textPrimary"
      >
        {title}
      </Text>
      {entries.length === 0 ? (
        <Text className="text-sm text-description">No values recorded.</Text>
      ) : (
        entries.map(([key, value]) => (
          <View
            key={key}
            className={
              compact
                ? "flex-row items-start justify-between gap-4 py-1"
                : "rounded-xl bg-surface p-3"
            }
          >
            <Text
              className={`${compact ? "min-w-0 flex-1" : ""} font-ralewayBold text-xs text-description`}
            >
              {auditLabel(key).replace(/\bids?\b/gi, (label) =>
                label.toUpperCase(),
              )}
            </Text>
            <Text
              selectable
              className={`${compact ? "max-w-[65%] text-right" : "mt-1"} text-sm text-textPrimary`}
            >
              {auditValue(value)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
