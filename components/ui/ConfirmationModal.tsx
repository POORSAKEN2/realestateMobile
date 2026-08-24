import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-textPrimary/40 px-6">
        <View className="w-full rounded-[28px] bg-white p-6">
          <Text className="font-ralewayExtraBold text-xl text-textPrimary">
            {title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-description">
            {description}
          </Text>
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-textPrimary/10"
              disabled={isPending}
              onPress={onCancel}
            >
              <Text className="font-ralewayExtraBold text-textPrimary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-textPrimary"
              disabled={isPending}
              onPress={onConfirm}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-ralewayExtraBold text-white">
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
