import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";

type StaffManagementEntryCardProps = {
  onPress: () => void;
};

export function StaffManagementEntryCard({
  onPress,
}: StaffManagementEntryCardProps) {
  return (
    <TouchableOpacity
      accessibilityHint="Opens your property manager team"
      accessibilityLabel="Staff management"
      accessibilityRole="button"
      activeOpacity={0.82}
      className="mt-8 min-h-24 flex-row items-center rounded-[28px] border border-primary/20 bg-white p-5 shadow-sm shadow-primary/10"
      onPress={onPress}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/60">
        <Ionicons name="people-outline" color={colors.primary} size={24} />
      </View>
      <View className="ml-4 min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-lg text-textPrimary">
          Staff management
        </Text>
        <Text className="mt-1 text-sm leading-5 text-description">
          Invite and manage property managers
        </Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.primary} size={21} />
    </TouchableOpacity>
  );
}
