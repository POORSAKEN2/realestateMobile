import { Text, View } from "react-native";
import { FormActionRow } from "../ui/forms/FormActionRow";

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
  return (
    <View className="gap-2">
      {hasChanges ? (
        <Text
          accessibilityLiveRegion="polite"
          className="text-xs text-description"
        >
          Unsaved profile changes
        </Text>
      ) : null}
      <FormActionRow
        appearance="card"
        tone="strong"
        isPending={isSaving}
        submitText="Save changes"
        submitDisabled={disabled || !hasChanges}
        onCancel={onDiscard}
        onSubmit={onPress}
      />
    </View>
  );
}
