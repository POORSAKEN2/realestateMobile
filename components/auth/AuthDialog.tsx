import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import {
  Keyboard,
  Modal,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MODAL_OVERLAY_CLASS_NAME } from "../../constants/modal";
import {
  getThemeVariables,
  useThemeColors,
} from "../../context/WorkspacePresentationContext";

export function AuthDialog({
  children,
  visible,
  onClose,
  onDismiss,
  panelClassName = "rounded-2xl",
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  panelClassName?: string;
}>) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const palette = useThemeColors();
  useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View
        className={`flex-1 items-center justify-center px-6 ${MODAL_OVERLAY_CLASS_NAME}`}
        style={[
          getThemeVariables(palette),
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <ScrollView
          accessibilityViewIsModal
          className={`w-full max-w-[480px] bg-panel ${panelClassName}`}
          style={{
            flexGrow: 0,
            maxHeight: Math.max(height - insets.top - insets.bottom - 48, 0),
          }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
