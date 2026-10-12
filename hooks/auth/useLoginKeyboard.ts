import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

export function useLoginKeyboard() {
  const [visible, setVisible] = useState(() => Keyboard.isVisible?.() ?? false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setVisible(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setVisible(false),
    );
    const viewport =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.visualViewport
        : null;
    const resize = () => {
      if (viewport) setVisible(viewport.height < window.innerHeight - 100);
    };
    viewport?.addEventListener("resize", resize);
    return () => {
      show.remove();
      hide.remove();
      viewport?.removeEventListener("resize", resize);
    };
  }, []);
  return visible;
}
