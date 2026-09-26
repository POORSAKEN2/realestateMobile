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
    <View className="gap-3 rounded-2xl border border-danger/20 bg-dangerSurface p-4">
      <Text accessibilityRole="alert" className="text-sm text-danger">
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
