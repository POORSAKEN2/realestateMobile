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
      <View className="flex-1 items-center justify-center bg-[#1d1d1f]/40 px-6">
        <View className="w-full rounded-[28px] bg-white p-6">
          <Text className="text-xl font-ralewayExtraBold text-[#1d1d1f]">{title}</Text>
          <Text className="mt-2 text-sm leading-5 text-[#6F6D6D]">
            {description}
          </Text>
          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-[#1d1d1f]/10"
              disabled={isPending}
              onPress={onCancel}
            >
              <Text className="font-ralewayExtraBold text-[#1d1d1f]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#1d1d1f]"
              disabled={isPending}
              onPress={onConfirm}
            >
              {isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-ralewayExtraBold text-white">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
