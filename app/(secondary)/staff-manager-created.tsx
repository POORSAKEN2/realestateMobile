import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button } from "../../components/ui/buttons/Button";
import { Screen } from "../../components/ui/Screen";
import { colors } from "../../constants/colors";
import { appRoutes } from "../../constants/navigation";

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default function StaffManagerCreatedScreen() {
  const params = useLocalSearchParams<{
    deliveryStatus?: string | string[];
    managerEmail?: string | string[];
    managerName?: string | string[];
  }>();
  const deliveryStatus = firstParam(params.deliveryStatus) ?? "queued";
  const deliveryFailed = deliveryStatus === "failed";
  const managerName = firstParam(params.managerName) ?? "Manager";
  const managerEmail = firstParam(params.managerEmail) ?? "";

  return (
    <Screen bottomInset="safe-area" className="bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View
            className={`h-24 w-24 items-center justify-center rounded-[32px] ${deliveryFailed ? "bg-warningSurface" : "bg-successSurface"}`}
          >
            <Ionicons
              name={deliveryFailed ? "alert-circle-outline" : "checkmark"}
              color={deliveryFailed ? colors.warning : colors.success}
              size={48}
            />
          </View>
          <Text className="mt-7 text-center font-ralewayExtraBold text-[30px] text-textPrimary">
            {deliveryStatus === "failed"
              ? "Invitation saved"
              : deliveryStatus === "sent"
                ? "Invitation sent"
                : "Invitation queued"}
          </Text>
          <Text className="mt-3 max-w-[320px] text-center text-base leading-6 text-description">
            {deliveryStatus === "failed"
              ? `${managerName}'s details were saved, but delivery failed. Resend it from Staff management.`
              : `${managerName} will receive an invitation to join your staff.`}
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
              <Text className="mt-1 font-ralewayBold text-base text-textPrimary">
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
            Access begins after the manager accepts the invitation. Pending
            invitations reserve staff capacity.
          </Text>
        </View>

        <View className="mt-8">
          <Button
            title="Done"
            onPress={() =>
              router.dismissTo(appRoutes.secondary.staffManagement)
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
