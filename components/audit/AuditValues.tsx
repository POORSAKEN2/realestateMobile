import { Text, View } from "react-native";

export function AuditValues({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) {
  return (
    <View className="gap-2">
      <Text className="font-ralewayExtraBold text-base text-textPrimary">
        {title}
      </Text>
      {Object.entries(values).length === 0 ? (
        <Text className="text-sm text-description">No values recorded.</Text>
      ) : (
        Object.entries(values).map(([key, value]) => (
          <View key={key} className="rounded-xl bg-surface p-3">
            <Text className="font-ralewayBold text-xs text-description">
              {key.replace(/_/g, " ")}
            </Text>
            <Text selectable className="mt-1 text-sm text-textPrimary">
              {value === null
                ? "Unavailable"
                : typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
