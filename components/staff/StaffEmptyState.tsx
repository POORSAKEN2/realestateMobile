import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";

export function StaffEmptyState() {
  return (
    <View className="items-center rounded-[28px] border border-primary/15 bg-white px-7 py-10 shadow-sm shadow-primary/10">
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10">
        <Ionicons name="people" color={colors.primary} size={38} />
      </View>
      <Text className="mt-5 font-ralewayExtraBold text-xl text-textPrimary">
        Your team
      </Text>
      <Text className="mt-2 text-center text-sm leading-6 text-description">
        Invite a property manager to help manage your properties.
      </Text>
    </View>
  );
}
