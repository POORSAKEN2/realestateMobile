import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../constants/colors";

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
  tone = "default",
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
  tone?: "default" | "strong";
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
          className={`min-h-14 flex-1 items-center justify-center rounded-2xl border ${tone === "strong" ? "border-primaryContent" : "border-primary"} bg-panel px-3 py-3 ${
            isCancelDisabled ? "opacity-60" : ""
          }`}
          disabled={isCancelDisabled}
          onPress={onCancel}
        >
          <Text
            className={`text-center font-ralewayBold text-base ${tone === "strong" ? "text-primaryContent" : "text-primary"}`}
          >
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
          className={`min-h-14 flex-1 items-center justify-center rounded-2xl ${tone === "strong" ? "bg-primaryContent" : "bg-primary"} px-3 py-3 ${
            isSubmitDisabled ? "opacity-60" : ""
          }`}
          disabled={isSubmitDisabled}
          onPress={onSubmit}
        >
          {isPending ? (
            <ActivityIndicator
              color={tone === "strong" ? colors.onInverse : "#FFFFFF"}
            />
          ) : (
            <Text
              className={`text-center font-ralewayBold ${appearance === "card" ? "text-base" : "text-lg"} ${tone === "strong" ? "text-onInverse" : "text-white"}`}
            >
              {submitText}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
