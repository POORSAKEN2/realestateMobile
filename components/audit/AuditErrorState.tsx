import { Text, View } from "react-native";
import { Button } from "../ui/buttons/Button";

export function AuditErrorState({
  error,
  onRetry,
  retrying = false,
}: {
  error: Error;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
      <Text accessibilityRole="alert" className="text-sm text-red-700">
        {error.message}
      </Text>
      <Button
        title="Retry"
        variant="secondary"
        isLoading={retrying}
        onPress={onRetry}
      />
    </View>
  );
}
