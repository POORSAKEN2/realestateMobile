import { Text, View } from "react-native";

export function BillingSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2">
      <Text className="min-w-0 flex-1 font-ralewayMedium text-xs text-description">
        {label}
      </Text>
      <Text className="max-w-[65%] text-right font-ralewayExtraBold text-sm text-textPrimary">
        {value}
      </Text>
    </View>
  );
}
