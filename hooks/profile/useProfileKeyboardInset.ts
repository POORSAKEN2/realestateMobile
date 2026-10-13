import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, View, type KeyboardEvent } from "react-native";

export function getProfileKeyboardInset(
  bottom: number,
  keyboardTop: number | null,
) {
  return keyboardTop === null ? 0 : Math.max(0, bottom - keyboardTop);
}

export function useProfileKeyboardInset() {
  const containerRef = useRef<View>(null);
  const [bottom, setBottom] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState<number | null>(
    Keyboard.metrics?.()?.screenY ?? null,
  );

  useEffect(() => {
    const show = (event: KeyboardEvent) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      setKeyboardTop(event.endCoordinates.screenY);
    };
    const hide = () => setKeyboardTop(null);
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow",
      show,
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", hide);
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return {
    containerRef,
    bottomInset: getProfileKeyboardInset(bottom, keyboardTop),
    onLayout: () =>
      containerRef.current?.measureInWindow((_x, y, _width, height) =>
        setBottom(y + height),
      ),
  };
}
