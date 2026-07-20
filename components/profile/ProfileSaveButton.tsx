import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";

type ProfileSaveButtonProps = {
  disabled: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onPress: () => void;
};

export function ProfileSaveButton({
  disabled,
  hasChanges,
  isSaving,
  onPress,
}: ProfileSaveButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Save profile changes"
      accessibilityState={{ disabled, busy: isSaving }}
      activeOpacity={0.82}
      className={`mt-5 h-14 flex-row items-center justify-center rounded-2xl ${
        disabled ? "bg-slate-300" : "bg-blue-600"
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      {isSaving ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons
          name={hasChanges ? "checkmark" : "checkmark-circle"}
          color="#FFFFFF"
          size={20}
        />
      )}
      <Text className="ml-2 font-soraSemiBold text-base text-white">
        {isSaving
          ? "Saving changes…"
          : hasChanges
            ? "Save changes"
            : "Profile up to date"}
      </Text>
    </TouchableOpacity>
  );
}
