import type { PropsWithChildren, ReactNode } from "react";
import {
  createContext,
  forwardRef,
  useImperativeHandle,
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
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MODAL_OVERLAY_CLASS_NAME } from "../../constants/modal";

type HostedSheet = {
  content: ReactNode;
  id: symbol;
  onClose: () => void;
};

type BottomSheetHostValue = {
  hide: (id: symbol) => void;
  show: (sheet: HostedSheet) => void;
};

const BottomSheetHostContext = createContext<BottomSheetHostValue | null>(null);
const BOTTOM_SHEET_EDGE_INSET = 8;
const PULL_DOWN_DISMISS_DISTANCE = 88;
const PULL_DOWN_DISMISS_VELOCITY = 0.8;

export type BottomSheetHostHandle = { requestClose: () => boolean };

export const BottomSheetHost = forwardRef<
  BottomSheetHostHandle,
  PropsWithChildren
>(function BottomSheetHost({ children }, ref) {
  const [activeSheet, setActiveSheet] = useState<HostedSheet | null>(null);
  const host = useMemo<BottomSheetHostValue>(
    () => ({
      hide: (id) =>
        setActiveSheet((current) => (current?.id === id ? null : current)),
      show: (sheet) => setActiveSheet(sheet),
    }),
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        if (!activeSheet) return false;
        activeSheet.onClose();
        return true;
      },
    }),
    [activeSheet],
  );

  return (
    <BottomSheetHostContext.Provider value={host}>
      {children}
      {activeSheet ? (
        <View style={StyleSheet.absoluteFill}>{activeSheet.content}</View>
      ) : null}
    </BottomSheetHostContext.Provider>
  );
});

export type BottomSheetModalProps = PropsWithChildren<{
  backdropAccessibilityLabel?: string;
  topInsetMode?: "none" | "safe-area";
  bottomInsetMode?: "edge" | "safe-area";
  closeOnBackdropPress?: boolean;
  dismissDisabled?: boolean;
  keyboardAvoiding?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  statusBarTranslucent?: boolean;
  visible: boolean;
}>;

export function BottomSheetModal({
  backdropAccessibilityLabel = "Close bottom sheet",
  topInsetMode = "safe-area",
  bottomInsetMode = "edge",
  children,
  closeOnBackdropPress = true,
  dismissDisabled = false,
  keyboardAvoiding = false,
  onClose,
  onDismiss,
  statusBarTranslucent = false,
  visible,
}: BottomSheetModalProps) {
  const host = useContext(BottomSheetHostContext);
  const hostId = useRef(Symbol("bottom-sheet")).current;
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const animationHeight = useRef(height);
  animationHeight.current = height;
  const [isMounted, setIsMounted] = useState(visible);
  const onCloseRef = useRef(onClose);
  const onDismissRef = useRef(onDismiss);
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const sheetTranslateY = useRef(
    new Animated.Value(visible ? 0 : height),
  ).current;
  const mountedRef = useRef(visible);
  const dismissDisabledRef = useRef(dismissDisabled);
  dismissDisabledRef.current = dismissDisabled;
  const renderedChildren = useRef(children);

  onCloseRef.current = onClose;
  onDismissRef.current = onDismiss;

  if (visible) {
    renderedChildren.current = children;
  }

  const pullDownResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !dismissDisabledRef.current,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !dismissDisabledRef.current &&
          gesture.dy > 6 &&
          gesture.dy > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          sheetTranslateY.setValue(Math.max(gesture.dy, 0));
        },
        onPanResponderRelease: (_, gesture) => {
          if (
            !dismissDisabledRef.current &&
            (gesture.dy >= PULL_DOWN_DISMISS_DISTANCE ||
              gesture.vy >= PULL_DOWN_DISMISS_VELOCITY)
          ) {
            onCloseRef.current();
            return;
          }

          Animated.spring(sheetTranslateY, {
            damping: 24,
            stiffness: 280,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetTranslateY, {
            damping: 24,
            stiffness: 280,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [sheetTranslateY],
  );

  useEffect(() => {
    if (!visible && !mountedRef.current) return;
    if (visible) {
      mountedRef.current = true;
      setIsMounted(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(animationHeight.current);
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
        toValue: visible ? 0 : animationHeight.current,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && !visible) {
        mountedRef.current = false;
        renderedChildren.current = null;
        setIsMounted(false);
        if (host || Platform.OS !== "ios") {
          requestAnimationFrame(() => onDismissRef.current?.());
        }
      }
    });

    return () => animation.stop();
  }, [backdropOpacity, host, sheetTranslateY, visible]);

  const sheet = (
    <KeyboardAvoidingView
      behavior={
        keyboardAvoiding && Platform.OS === "ios" ? "padding" : undefined
      }
      className="flex-1 justify-end"
      style={{ paddingTop: topInsetMode === "safe-area" ? insets.top + 8 : 0 }}
      enabled={keyboardAvoiding}
    >
      <Animated.View
        className={`absolute inset-0 ${MODAL_OVERLAY_CLASS_NAME}`}
        pointerEvents={visible ? "auto" : "none"}
        style={{ opacity: backdropOpacity }}
      >
        {closeOnBackdropPress ? (
          <Pressable
            accessibilityLabel={backdropAccessibilityLabel}
            accessibilityRole="button"
            className="absolute inset-0"
            onPress={() => {
              if (!dismissDisabledRef.current) onCloseRef.current();
            }}
          />
        ) : null}
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        className="overflow-hidden rounded-t-[30px] bg-panel pt-5"
        pointerEvents={visible ? "auto" : "none"}
        style={{
          maxHeight: "100%",
          flexShrink: 1,
          marginBottom:
            Platform.OS === "ios" && bottomInsetMode === "edge"
              ? -Math.max(insets.bottom - BOTTOM_SHEET_EDGE_INSET, 0)
              : 0,
          transform: [{ translateY: sheetTranslateY }],
        }}
      >
        <View
          {...pullDownResponder.panHandlers}
          accessible={false}
          className="absolute top-0 z-10 h-5 w-24 items-center self-center pt-1.5"
          hitSlop={{ bottom: 8 }}
        >
          <View className="h-1 w-10 rounded-full bg-description/25" />
        </View>
        {renderedChildren.current}
      </Animated.View>
    </KeyboardAvoidingView>
  );

  useLayoutEffect(() => {
    if (!host) return;

    if (isMounted) {
      host.show({
        content: sheet,
        id: hostId,
        onClose: () => {
          if (!dismissDisabledRef.current) onCloseRef.current();
        },
      });
    } else {
      host.hide(hostId);
    }
  }, [host, hostId, isMounted, sheet]);

  useLayoutEffect(() => () => host?.hide(hostId), [host, hostId]);

  if (host) return null;

  return (
    <Modal
      animationType="none"
      navigationBarTranslucent={Platform.OS === "android"}
      onDismiss={onDismiss}
      onRequestClose={() => {
        if (!dismissDisabledRef.current) onCloseRef.current();
      }}
      statusBarTranslucent={
        Platform.OS === "android" ? true : statusBarTranslucent
      }
      transparent
      visible={isMounted}
    >
      {sheet}
    </Modal>
  );
}
