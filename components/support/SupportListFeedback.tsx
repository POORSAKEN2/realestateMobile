import { Text, View } from "react-native";

import { Button } from "../ui/buttons/Button";
import { ModuleLoadingState } from "../ui/ModuleState";

export function SupportListFeedback({
  label,
  hasData,
  isPending,
  isError,
  isFetching,
  onRetry,
}: {
  label: "FAQs" | "tickets";
  hasData: boolean;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
}) {
  if (!hasData && isPending) {
    return (
      <ModuleLoadingState
        title={`Loading ${label}`}
        description={`Fetching ${label}.`}
      />
    );
  }

  if (!isError) return null;

  return (
    <View className="mb-3 gap-3 rounded-2xl border border-primary/20 bg-panel p-4">
      <Text
        accessibilityRole="alert"
        className="text-sm leading-5 text-textPrimary"
      >
        {hasData
          ? `Could not refresh ${label}. Showing the last loaded results.`
          : `Could not load ${label}. Try again.`}
      </Text>
      <Button
        title={`Retry ${label}`}
        variant="secondary"
        isLoading={isFetching}
        onPress={onRetry}
      />
    </View>
  );
}
