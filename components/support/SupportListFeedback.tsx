import { ActivityIndicator, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { Button } from "../ui/buttons/Button";

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
      <View
        className="flex-1 items-center justify-center gap-3"
        accessibilityRole="progressbar"
        accessibilityLabel={`Loading ${label}`}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm text-description">Loading {label}...</Text>
      </View>
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
