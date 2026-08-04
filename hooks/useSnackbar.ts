import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_AUTO_HIDE_DURATION = 4000;

export function useSnackbar({
  autoHideDuration = DEFAULT_AUTO_HIDE_DURATION,
}: {
  autoHideDuration?: number;
} = {}) {
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoHide = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const dismiss = useCallback(() => {
    clearAutoHide();
    setMessage("");
  }, [clearAutoHide]);

  const show = useCallback(
    (nextMessage: string) => {
      clearAutoHide();
      setMessage(nextMessage);

      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          setMessage("");
        }, autoHideDuration);
      }
    },
    [autoHideDuration, clearAutoHide],
  );

  useEffect(() => {
    return clearAutoHide;
  }, [clearAutoHide]);

  return {
    dismiss,
    isVisible: Boolean(message),
    message,
    show,
  };
}
