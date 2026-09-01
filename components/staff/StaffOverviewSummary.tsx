import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { colors } from "../../constants/colors";

type StaffOverviewSummaryProps = {
  managerCount: number;
  managerLimit: number;
};

export function StaffOverviewSummary({
  managerCount,
  managerLimit,
}: StaffOverviewSummaryProps) {
  return (
    <View className="flex-row items-center rounded-2xl border border-accent bg-accent/50 px-4 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
        <Ionicons name="people" color={colors.success} size={19} />
      </View>
      <Text className="ml-3 flex-1 font-ralewayExtraBold text-sm text-textPrimary">
        {managerCount} of {managerLimit} managers
      </Text>
      <Text className="font-ralewayBold text-xs text-success">
        {managerCount < managerLimit ? "Space available" : "Limit reached"}
      </Text>
    </View>
  );
}
