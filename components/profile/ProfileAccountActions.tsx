import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
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
        onPress={onSignOut}
        className="mt-6 min-h-14 flex-row items-center gap-3 rounded-2xl border border-textPrimary/10 bg-panel px-4 py-3"
      >
        <Ionicons name="log-out-outline" color={colors.danger} size={20} />
        <Text className="font-ralewaySemiBold text-sm text-danger">
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
