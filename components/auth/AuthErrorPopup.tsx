import { useRef, useState } from "react";
import { Platform } from "react-native";
import { AuthDialog } from "./AuthDialog";
import type { AuthErrorFeedback as Feedback } from "../../utils/auth/authErrorFeedback";
import { AuthErrorFeedback } from "./AuthErrorFeedback";

export function AuthErrorPopup({
  feedback,
  disabled = false,
  onRetry,
}: {
  feedback: Feedback;
  disabled?: boolean;
  onRetry: () => void;
}) {
  const [dismissed, setDismissed] = useState<Feedback | null>(null);
  const pendingRetry = useRef<(() => void) | null>(null);
  const visible = dismissed !== feedback;

  const close = () => setDismissed(feedback);
  const retry = () => {
    if (disabled) return;
    close();
    if (Platform.OS === "ios") pendingRetry.current = onRetry;
    else onRetry();
  };

  return (
    <AuthDialog
      visible={visible}
      onClose={close}
      onDismiss={() => {
        const callback = pendingRetry.current;
        pendingRetry.current = null;
        callback?.();
      }}
    >
      <AuthErrorFeedback
        feedback={feedback}
        inverse
        disabled={disabled}
        onRetry={retry}
        onDismiss={close}
      />
    </AuthDialog>
  );
}
