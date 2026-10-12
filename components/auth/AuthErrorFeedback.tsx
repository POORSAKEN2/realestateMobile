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
  onDismiss,
}: {
  feedback: Feedback;
  onRetry?: () => void;
  disabled?: boolean;
  inverse?: boolean;
  onDismiss?: () => void;
}) {
  const remaining = useAuthRetryDelay(feedback);
  const color = "text-textPrimary";
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`${onDismiss ? "gap-3 p-6" : "gap-2 p-4"} rounded-2xl border ${inverse ? "border-white/30 bg-panel" : "border-danger/20 bg-dangerSurface"}`}
    >
      <Text
        className={`font-ralewayBold ${onDismiss ? "text-xl leading-7" : "text-base"} ${color}`}
      >
        {feedback.title}
      </Text>
      <Text
        className={`font-ralewayMedium ${onDismiss ? "text-base leading-6 text-description" : `text-sm leading-5 ${color}`}`}
      >
        {feedback.message}
      </Text>
      {remaining > 0 ? (
        <Text className={`text-sm ${color}`}>Try again in {remaining}s.</Text>
      ) : null}
      {onDismiss || (feedback.retryable && onRetry) ? (
        <View className={onDismiss ? "mt-3 flex-row items-stretch gap-3" : ""}>
          {onDismiss ? (
            <View className="min-w-0 flex-1">
              <Button
                title="Close"
                variant="secondary"
                compact
                onPress={onDismiss}
              />
            </View>
          ) : null}
          {feedback.retryable && onRetry ? (
            <View className={onDismiss ? "min-w-0 flex-1" : ""}>
              <Button
                title="Try again"
                variant="secondary"
                compact={Boolean(onDismiss)}
                leadingIcon={
                  onDismiss ? undefined : (
                    <Feather
                      name="refresh-cw"
                      size={18}
                      color={colors.primaryContent}
                    />
                  )
                }
                disabled={disabled || remaining > 0}
                onPress={onRetry}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
