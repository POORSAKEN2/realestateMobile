import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function StaffManagerCreatedScreen() {
  const params = useLocalSearchParams<{
    mode?: string | string[];
    managerEmail?: string | string[];
    managerName?: string | string[];
  }>();
  const invited = firstParam(params.mode) === "invitation";
  const managerName = firstParam(params.managerName) ?? "Manager";
  const managerEmail = firstParam(params.managerEmail) ?? "";

  return (
    <Screen bottomInset="safe-area" className="bg-surface">
      <View className="flex-1 justify-center">
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-successSurface">
            <Ionicons name="checkmark" color={colors.success} size={48} />
          </View>
          <Text className="mt-7 text-center font-ralewayExtraBold text-[30px] text-textPrimary">
            {invited ? "Invitation sent" : "Manager created"}
          </Text>
          <Text className="mt-3 max-w-[320px] text-center text-base leading-6 text-description">
            {invited ? `${managerName} will receive an invitation to join your staff.` : `${managerName} can now sign in using the account credentials you created.`}
          </Text>
        </View>

        <View className="mt-8 overflow-hidden rounded-[24px] border border-primary/15 bg-white shadow-sm shadow-primary/10">
          <View className="min-h-16 flex-row items-center px-5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons name="mail-outline" color={colors.primary} size={20} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-ralewayBold text-xs text-description">
                Account email
              </Text>
              <Text
                className="mt-1 font-ralewayBold text-base text-textPrimary"
                numberOfLines={1}
              >
                {managerEmail}
              </Text>
            </View>
          </View>
          <View className="min-h-16 flex-row items-center border-t border-primary/10 px-5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons
                name="shield-checkmark-outline"
                color={colors.primary}
                size={20}
              />
            </View>
            <View className="ml-3">
              <Text className="font-ralewayBold text-xs text-description">
                Role
              </Text>
              <Text className="mt-1 font-ralewayBold text-base text-textPrimary">
                Manager
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row rounded-2xl border border-warning/20 bg-warningSurface p-4">
          <Ionicons
            name="lock-closed-outline"
            color={colors.warning}
            size={20}
          />
          <Text className="ml-3 flex-1 text-sm leading-6 text-description">
            {invited ? "Access begins after the manager accepts the invitation." : "Send the temporary password through a secure channel. It is not included on this screen."}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.84}
          className="mt-8 h-14 items-center justify-center rounded-2xl bg-primary"
          onPress={() => router.dismissTo(appRoutes.secondary.staffManagement)}
        >
          <Text className="font-ralewayExtraBold text-base text-white">
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
