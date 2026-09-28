import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/colors";
import { Button } from "../ui/buttons/Button";

type ProfileSaveButtonProps = {
  disabled: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  onPress: () => void;
  onDiscard: () => void;
};

export function ProfileSaveButton({
  disabled,
  hasChanges,
  isSaving,
  onPress,
  onDiscard,
}: ProfileSaveButtonProps) {
  if (!hasChanges)
    return (
      <View className="mt-4 flex-row items-center gap-2">
        <Ionicons
          name="checkmark-circle-outline"
          color={colors.success}
          size={18}
        />
        <Text
          accessibilityLiveRegion="polite"
          className="text-sm text-description"
        >
          Profile up to date
        </Text>
      </View>
    );
  return (
    <View className="gap-2">
      <Text
        accessibilityLiveRegion="polite"
        className="text-xs text-description"
      >
        Unsaved profile changes
      </Text>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onDiscard}
          className="min-h-12 justify-center px-2"
        >
          <Text className="font-ralewaySemiBold text-sm text-description">
            Discard
          </Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Button
            title="Save changes"
            disabled={disabled}
            isLoading={isSaving}
            onPress={onPress}
          />
        </View>
      </View>
    </View>
  );
}
