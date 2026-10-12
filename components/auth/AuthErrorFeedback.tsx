import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import type { AuthErrorFeedback as Feedback } from "../../utils/auth/authErrorFeedback";
import { Button } from "../ui/buttons/Button";
import { useAuthRetryDelay } from "../../hooks/auth/useAuthRetryDelay";

export function AuthErrorFeedback({
  feedback,
  onRetry,
  disabled = false,
  inverse = false,
}: {
  feedback: Feedback;
  onRetry?: () => void;
  disabled?: boolean;
  inverse?: boolean;
}) {
  const remaining = useAuthRetryDelay(feedback);
  const color = "text-textPrimary";
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`gap-2 rounded-2xl border p-4 ${inverse ? "border-white/30 bg-panel" : "border-danger/20 bg-dangerSurface"}`}
    >
      <Text className={`font-ralewayBold text-base ${color}`}>
        {feedback.title}
      </Text>
      <Text className={`font-ralewayMedium text-sm leading-5 ${color}`}>
        {feedback.message}
      </Text>
      {feedback.requestId ? (
        <Text selectable className={`text-xs ${color}`}>
          Reference: {feedback.requestId}
        </Text>
      ) : null}
      {remaining > 0 ? (
        <Text className={`text-sm ${color}`}>Try again in {remaining}s.</Text>
      ) : null}
      {feedback.retryable && onRetry ? (
        <Button
          title="Try again"
          variant="secondary"
          leadingIcon={
            <Feather
              name="refresh-cw"
              size={18}
              color={colors.primaryContent}
            />
          }
          disabled={disabled || remaining > 0}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}
