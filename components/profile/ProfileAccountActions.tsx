import { Text, TouchableOpacity, View } from "react-native";
import { ProfileMenuSection } from "./ProfileMenuSection";

type ProfileAccountActionsProps = {
  onOpenAdditionalSettings: () => void;
  onSignOut: () => void;
  disabled?: boolean;
};

export function ProfileAccountActions({
  onOpenAdditionalSettings,
  onSignOut,
  disabled = false,
}: ProfileAccountActionsProps) {
  return (
    <View>
      {/* <ProfileMenuSection
        title="Account"
        items={[
          {
            icon: "settings-outline",
            label: "Settings",
            supportingText: "Workspace, security, and privacy",
            disabled,
            onPress: onOpenAdditionalSettings,
          },
        ]}
      /> */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityState={{ disabled }}
        disabled={disabled}
        activeOpacity={0.8}
        onPress={onSignOut}
        className={`mt-6 min-h-12 items-center justify-center rounded-2xl bg-danger px-4 py-3 ${disabled ? "opacity-50" : ""}`}
      >
        <Text className="text-center font-ralewayExtraBold text-onDanger">
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
