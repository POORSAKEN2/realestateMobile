import type { PropsWithChildren, ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HostedSheet = {
  content: ReactNode;
  id: symbol;
};

type BottomSheetHostValue = {
  hide: (id: symbol) => void;
  show: (sheet: HostedSheet) => void;
};

const BottomSheetHostContext = createContext<BottomSheetHostValue | null>(null);
const FORM_SHEET_EDGE_OVERDRAW = 16;

export function BottomSheetHost({ children }: PropsWithChildren) {
  const [activeSheet, setActiveSheet] = useState<HostedSheet | null>(null);
  const insets = useSafeAreaInsets();
  const host = useMemo<BottomSheetHostValue>(
    () => ({
      hide: (id) =>
        setActiveSheet((current) => (current?.id === id ? null : current)),
      show: (sheet) => setActiveSheet(sheet),
    }),
    [],
  );

  return (
    <BottomSheetHostContext.Provider value={host}>
      {children}
      {activeSheet ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { bottom: -(insets.bottom + FORM_SHEET_EDGE_OVERDRAW) },
          ]}
        >
          {activeSheet.content}
        </View>
      ) : null}
    </BottomSheetHostContext.Provider>
  );
}

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
  const host = useContext(BottomSheetHostContext);
  const hostId = useRef(Symbol("bottom-sheet")).current;
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

  const sheet = (
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
  );

  useLayoutEffect(() => {
    if (!host) return;

    if (isMounted) {
      host.show({ content: sheet, id: hostId });
    } else {
      host.hide(hostId);
    }

    return () => host.hide(hostId);
  }, [host, hostId, isMounted, sheet]);

  if (host) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={statusBarTranslucent}
      transparent
      visible={isMounted}
    >
      {sheet}
    </Modal>
  );
}
