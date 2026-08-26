import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function FormActionRow({
  appearance = "default",
  cancelDisabled = false,
  cancelText = "Cancel",
  disabled = false,
  isPending,
  onCancel,
  onSubmit,
  showCancelAction = true,
  showSubmitAction = true,
  submitDisabled = false,
  submitText,
}: {
  appearance?: "default" | "card";
  cancelDisabled?: boolean;
  cancelText?: string;
  disabled?: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  showCancelAction?: boolean;
  showSubmitAction?: boolean;
  submitDisabled?: boolean;
  submitText: string;
}) {
  const actionsDisabled = disabled || isPending;
  const isCancelDisabled = actionsDisabled || cancelDisabled;
  const isSubmitDisabled = actionsDisabled || submitDisabled;

  return (
    <View className={`flex-row ${showCancelAction ? "gap-3" : ""}`}>
      {showCancelAction ? (
        <TouchableOpacity
          accessibilityLabel={cancelText}
          accessibilityRole="button"
          accessibilityState={{ disabled: isCancelDisabled }}
          activeOpacity={0.85}
          className={`h-14 flex-1 items-center justify-center rounded-2xl border border-primary bg-white ${
            isCancelDisabled ? "opacity-60" : ""
          }`}
          disabled={isCancelDisabled}
          onPress={onCancel}
        >
          <Text className="font-ralewayBold text-base text-primary">
            {cancelText}
          </Text>
        </TouchableOpacity>
      ) : null}
      {showSubmitAction ? (
        <TouchableOpacity
          accessibilityLabel={submitText}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitDisabled, busy: isPending }}
          activeOpacity={0.85}
          className={`h-14 flex-auto items-center justify-center rounded-2xl bg-primary ${
            isSubmitDisabled ? "opacity-60" : ""
          }`}
          disabled={isSubmitDisabled}
          onPress={onSubmit}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={
                appearance === "card"
                  ? "font-ralewayBold text-base text-white"
                  : "font-ralewayBold text-lg text-white"
              }
            >
              {submitText}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
