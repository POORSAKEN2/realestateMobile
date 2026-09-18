import {
  ActivityIndicator,
  Modal,
  ScrollView,
  useWindowDimensions,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { MODAL_OVERLAY_CLASS_NAME } from "../../constants/modal";

export function ConfirmationModal({
  confirmLabel = "Delete",
  description,
  isPending = false,
  onCancel,
  onConfirm,
  title,
  visible,
}: {
  confirmLabel?: string;
  description: string;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cancel = () => {
    if (!isPending) onCancel();
  };
  return (
    <Modal
      animationType="fade"
      onRequestClose={cancel}
      transparent
      visible={visible}
    >
      <View
        className={`flex-1 items-center justify-center px-6 ${MODAL_OVERLAY_CLASS_NAME}`}
      >
        <ScrollView
          accessibilityViewIsModal
          className="w-full max-w-[480px] rounded-[28px] bg-white"
          contentContainerStyle={{ padding: 24 }}
          style={{
            flexGrow: 0,
            maxHeight: Math.max(height - insets.top - insets.bottom - 48, 0),
          }}
          bounces={false}
        >
          <Text
            accessibilityRole="header"
            className="font-ralewayExtraBold text-xl text-textPrimary"
          >
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-description">
            {description}
          </Text>
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-textPrimary/10 px-3 py-3"
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              accessibilityState={{ disabled: isPending }}
              onPress={cancel}
            >
              <Text className="text-center font-ralewayExtraBold text-textPrimary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-textPrimary px-3 py-3"
              disabled={isPending}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: isPending, busy: isPending }}
              onPress={() => {
                if (!isPending) onConfirm();
              }}
            >
              {isPending ? (
                <ActivityIndicator color={colors.whitePrimary} />
              ) : (
                <Text className="text-center font-ralewayExtraBold text-white">
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
