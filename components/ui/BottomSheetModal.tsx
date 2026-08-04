import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";

export type BottomSheetModalProps = PropsWithChildren<{
  backdropAccessibilityLabel?: string;
  backdropClassName?: string;
  closeOnBackdropPress?: boolean;
  keyboardAvoiding?: boolean;
  onClose: () => void;
  statusBarTranslucent?: boolean;
  visible: boolean;
}>;

export function BottomSheetModal({
  backdropAccessibilityLabel = "Close bottom sheet",
  backdropClassName = "bg-slate-950/40",
  children,
  closeOnBackdropPress = true,
  keyboardAvoiding = false,
  onClose,
  statusBarTranslucent = false,
  visible,
}: BottomSheetModalProps) {
  const { height } = useWindowDimensions();
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetTranslateY = useRef(
    new Animated.Value(visible ? 0 : height),
  ).current;
  const renderedChildren = useRef(children);

  if (visible) {
    renderedChildren.current = children;
  }

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(height);
    }

    const animation = Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: visible ? 220 : 180,
        easing: visible ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        toValue: visible ? 1 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: visible ? 280 : 220,
        easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        toValue: visible ? 0 : height,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) setIsMounted(false);
    });

    return () => animation.stop();
  }, [backdropOpacity, height, sheetTranslateY, visible]);

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
      transparent
      visible={isMounted}
    >
      <KeyboardAvoidingView
        behavior={
          keyboardAvoiding && Platform.OS === "ios" ? "padding" : undefined
        }
        className="flex-1 justify-end"
        enabled={keyboardAvoiding}
      >
        <Animated.View
          className={`absolute inset-0 ${backdropClassName}`}
          pointerEvents={visible ? "auto" : "none"}
          style={{ opacity: backdropOpacity }}
        >
          {closeOnBackdropPress ? (
            <Pressable
              accessibilityLabel={backdropAccessibilityLabel}
              accessibilityRole="button"
              className="absolute inset-0"
              onPress={onClose}
            />
          ) : null}
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          pointerEvents={visible ? "auto" : "none"}
          style={{ transform: [{ translateY: sheetTranslateY }] }}
        >
          {renderedChildren.current}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
