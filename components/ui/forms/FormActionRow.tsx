import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

export function FormActionRow({
  appearance = "default",
  cancelText = "Cancel",
  disabled = false,
  isPending,
  onCancel,
  onSubmit,
  showCancelAction = true,
  showSubmitAction = true,
  submitText,
}: {
  appearance?: "default" | "card";
  cancelText?: string;
  disabled?: boolean;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  showCancelAction?: boolean;
  showSubmitAction?: boolean;
  submitText: string;
}) {
  const actionsDisabled = disabled || isPending;

  return (
    <View className={`flex-row ${showCancelAction ? "gap-3" : ""}`}>
      {showCancelAction ? (
        <TouchableOpacity
          accessibilityLabel={cancelText}
          accessibilityRole="button"
          accessibilityState={{ disabled: actionsDisabled }}
          activeOpacity={0.85}
          className={`h-14 flex-1 items-center justify-center rounded-2xl border border-secondary bg-white ${
            actionsDisabled ? "opacity-60" : ""
          }`}
          disabled={actionsDisabled}
          onPress={onCancel}
        >
          <Text className="font-ralewayBold text-base text-secondary">
            {cancelText}
          </Text>
        </TouchableOpacity>
      ) : null}
      {showSubmitAction ? (
        <TouchableOpacity
          accessibilityLabel={submitText}
          accessibilityRole="button"
          accessibilityState={{ disabled: actionsDisabled, busy: isPending }}
          activeOpacity={0.85}
          className={`h-14 flex-auto items-center justify-center rounded-2xl bg-secondary ${
            actionsDisabled ? "opacity-60" : ""
          }`}
          disabled={actionsDisabled}
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
